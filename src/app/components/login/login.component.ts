import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { User } from '../../models/user';
import { UserService } from '../../services/user.service';
import * as rsa from 'rsa';
import * as bcu from 'bigint-crypto-utils';
import * as bc from 'bigint-conversion';
import * as sha from 'object-sha';
import * as io from 'socket.io-client'
import { ThrowStmt } from '@angular/compiler';


@Component({
	selector:'login',
	templateUrl: './login.component.html',
	providers: [UserService]
})

export class LoginComponent implements OnInit{
	public title: string;
	public user: User;
	public status: string;
	public identity;
  public token;
  keysUser: rsa.keys;
  publicKeyLB; // clave publica del servidor de autenticación
  verifiedIdentity;
  private socket;
  connCounter = 0;
  //static keysUser: any;


	constructor(
		private _route: ActivatedRoute,
		private _router: Router,
    private _userService: UserService
	) {
		this.title = 'Identifícate';
		this.user = new User("", "", "", "", "");
	}

	async ngOnInit() {
    console.log('Componente de login cargado...');
    // Obtener clave publica del servidor de autenticación LB
    this.getPublicKeyLB();
    // // escucha un evento de socket.io server
    this._userService.setupSocketConnection();
    // this._userService.listen('test event').subscribe((data) => {
    //   console.log('socket-----')
    //   console.log(data)
    // })
	}

	async onSubmit() {
    // 1. Petición al servidor de autenticación para que si esta en la BBDD, nos envíe sus datos
    this._userService.signup(this.user)
      .subscribe( res => {
        console.log('response del server: ', res)
        this.identity = res.user
        console.log('Identity: ', this.identity)
        // Enviamos los datos del usuario extraidos del servidor, al socket
        this._userService.sendIdentitySockets(this.identity)
        // 2. Verifica que la identidad no se nula
        if(!this.identity || !this.identity._id) {
          this.status = 'error';
        } else {
          this.status = 'success';
          console.log('Status: ', this.status)
          // 3. Verificar el rol del usuario
          if(res.user.role === 'user') {
            // 4. Generación de claves del usuario con rol 'user'
            this.keysUser = rsa.rsaKeyGeneration()
            // Guardamos el el localStorage la clave privada del usuario
            localStorage.setItem('privateKeyUser', JSON.stringify({
                d: bc.bigintToHex(this.keysUser['privateKey']['d']),
                publicKey: {
                  e: bc.bigintToHex(this.keysUser['publicKey']['e']),
                  n: bc.bigintToHex(this.keysUser['publicKey']['n'])
                }
            }))
            console.log('keys del usuario: ', this.keysUser)
            console.log('identity: ', this.identity)
            const x = JSON.stringify(this.identity)
            console.log('identity stringify: ', x)
            const m = bc.bigintToHex(bc.textToBigint(x))
            console.log('m: ', m)
            const message = { message: m}
            // 5. Creación de la identidad anónima del usuario
            // 5.1 Firmamos la identidad del usuario > identidad formada por el los parámetros del usuario id,
            // nombre, apellido, , email, pass, rol;
            this._userService.signIdentity(message)
              .subscribe( resp => {
                console.log('Sign de la identidad en el cliente', {
                  sign: resp['message']
                })
                let s = bc.hexToBigint(resp['message'])
                // 5.2 Verificamos la firma del servidor en la identidad
                let sM = this.publicKeyLB.verify(s);
                console.log('Verificación de la firma: ', sM);
                this.verifiedIdentity = bc.bigintToText(sM)
                console.log('Identidad original verificada: ', this.verifiedIdentity);

                // 5.2 Construcción del aCert
                const aCert = {
                  publicKey: this.keysUser.publicKey,
                  signature: bc.hexToBigint(resp['message']) // signature en hexadecimal
                }
                console.log('aCert del usuario: ', aCert)

                // 5.3 Construcción de la identidad anonima del usuario
                const anonymousID = {
                  cert: aCert,
                  privateKey: this.keysUser.privateKey
                }
                console.log('identidad anónima: ', anonymousID)
                // Guardamos en el localStorage la identidad anónima del usuario
                localStorage.setItem('anonymousID', JSON.stringify({
                  cert: {
                    publicKey: {
                      e: bc.bigintToHex(this.keysUser['publicKey']['e']),
                      n: bc.bigintToHex(this.keysUser['publicKey']['n'])
                    },
                    signature: resp['message']
                  },
                  privateKey: {
                    d: bc.bigintToHex(this.keysUser['privateKey']['d']),
                    publicKey: {
                      e: bc.bigintToHex(this.keysUser['publicKey']['e']),
                      n: bc.bigintToHex(this.keysUser['publicKey']['n'])
                    }
                  }
                }));
                //this._router.navigate(['/']);
                this._router.navigate(['/encuesta']);
              })

          } if (res.user.role === 'admin') {
              console.log('Eres administrador!!!!!!!')
              this._router.navigate(['/admin']);
          }
        }

      })
  }

  async getPublicKeyLB() {
    this._userService.getPKey()
      .subscribe( res => {
        // public key del servidor de autenticación LB
        this.publicKeyLB = new rsa.PublicKey(bc.hexToBigint(res['e']), bc.hexToBigint(res['n']))
        console.log('e pubkeyLB on getPublicKeyLB: ', this.publicKeyLB.e);
        console.log('n pubkeyLB on getPublicKeyLB: ', this.publicKeyLB.n);
      })
  }

  sendConection(){
    this.socket = io.connect('http://localhost:3800');
    this.socket.emit('user', this.user.email)
  }

	getToken(){
		this._userService.signup(this.user, 'true').subscribe(
			response => {
				this.token = response.token;

				console.log(this.token);

				if(this.token.length <= 0){
					this.status = 'error';
				}else{
					this.status = 'success';
					// PERSISTIR TOKEN DEL USUARIO
					localStorage.setItem('token', this.token);

					// Conseguir los contadores o estadisticas del usuario

					this._router.navigate(['/']); /* Para ir a home una vez nos logueemos */
				}

			},
			error => {
				const errorMessage = <any>error;
				console.log(errorMessage);

				if(errorMessage != null){
					this.status = 'error';
				}
			}
		);
	}
}
