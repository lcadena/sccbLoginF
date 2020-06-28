import { Component, OnInit } from '@angular/core';
import * as rsa from 'rsa';
import * as bcu from 'bigint-crypto-utils';
import * as bc from 'bigint-conversion';
import * as sha from 'object-sha';
import { EncuestaService } from 'src/app/services/encuesta.service';
import { Router } from '@angular/router';
import { LoginComponent } from '../login/login.component';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-encuesta',
  templateUrl: './encuesta.component.html',
  styleUrls: ['./encuesta.component.css']
})
export class EncuestaComponent implements OnInit {
  answer1;
  answer2;
  answer3;
  responsepost;
  responseSlices;
  keysEF: rsa.keys;
  publicKeyEB;
  c;

  constructor(private encuestaservice: EncuestaService, private router: Router, private userservice: UserService) { }

  ngOnInit() {
    // Generar claves del front de encuesta
    this.keysEF = rsa.rsaKeyGeneration();
    console.log('Claves de encuestas: ', this.keysEF)
    // Obtener Kpub del servidor de encuestas
    this.getPublicKeyEB()
    // Obtener slices de clave privada del servidor de la encuesta
    this.getSlices()
  }

  async getPublicKeyEB() {
    this.encuestaservice.getPublicKey()
      .subscribe( res => {
        this.publicKeyEB = new rsa.PublicKey(bc.hexToBigint(res['e']), bc.hexToBigint(res['n']));
        console.log('e pubkey on getPublicKeyEB: ', this.publicKeyEB.e);
        console.log('n pubkey on getPublicKeyeEB: ', this.publicKeyEB.n);
      })
  }

  send() {
    // console.log('valor de question1: ', this.answer1)
    // console.log('valor de question2: ', this.answer2)
    // console.log('valor de question2: ', this.answer3)
  }

  async sendAnswers() {
    // Creamos el formato de la encuesta
    const encuesta = {
        a1: this.answer1,
        a2: this.answer2,
        a3: this.answer3
    };
    console.log('encuesta: ', encuesta)
    // Encriptar la encuesta con kpub de E c=EpubE(e)
    const encString = JSON.stringify(encuesta)
    console.log('encString: ', encString)
    this.c = this.publicKeyEB.encrypt(bc.textToBigint(encString))
    console.log('encuesta encriptada en bigint: ', this.c)
    // Extraemos las claves del usuario del LocalStorage
    const keysUser = await this.userservice.getKeysUser()
    console.log('keys del usuario en la encuesta: ', keysUser)
    const privkeyU = {
      d: bc.hexToBigint(keysUser.d),
      publicKey: {
        e: bc.hexToBigint(keysUser.publicKey.e),
        n: bc.hexToBigint(keysUser.publicKey.n)
      }
    }
    console.log('keys del usuario en la encuesta en Bigint: ', privkeyU)
    const publicKeyUser = new rsa.PublicKey(bc.hexToBigint(keysUser.publicKey.e), bc.hexToBigint(keysUser.publicKey.n));
    console.log('publicKeyUser en encuesta: ', publicKeyUser)
    const privateKeyUser = new rsa.PrivateKey(privkeyU.d, publicKeyUser)
    console.log('privateKeyUser en encuesta: ', privateKeyUser)
    // A genera una firma válida de c con su privA: s=SprivA(Hash(c))
    const body = {
      message: bc.bigintToHex(this.c)
    }
    // Digest del body
    const digest = await sha.digest(body, 'SHA-256')
    console.log('digest en encuesta: ', digest)
    const digestH = bc.hexToBigint(digest)
    console.log('digest en encuesta en hexadecimal: ', digestH)
    let s = privateKeyUser.sign(digestH)
    console.log('signature: ', s)
    // Extraemos la identidad anónima del usuario del localStorage
    const aIdUser = this.userservice.getAnonymousID();
    console.log('aID en componente encuesta: ', aIdUser)
    // Creamos el mensaje a enviar al servidor
    const message = {
      message: body, // encuesta encriptada
      signature: bc.bigintToHex(s), // firma del hash de encuesta encriptada
      aID: aIdUser, // identidad anónima del usuario
      publicKey: { // Clave publica usuario
        e: bc.bigintToHex(publicKeyUser.e),
        n: bc.bigintToHex(publicKeyUser.n)
      }
    }
    // Enviamos al servidor de encuestas
    this.encuestaservice.submitPoll(message)
      .subscribe( res => {
        console.log('mensage que llega del server: ', res);
        this.responsepost = res['message'];
        document.getElementById('submitpoll').innerHTML =  'Respuesta del server: ' + this.responsepost;
      })
    // this.encuestaservice.postPoll(message)
    //   .subscribe( res => {
    //     console.log('mensage en suscribe: ', res);
    //     this.responsepost = res['message'];
    //     console.log('mensage en suscribe2: ', this.responsepost);
    //   },
    //   err => {
    //     console.log(err);
    //   });
  }

  // Shamir Secret Sharing
  slice: string;
  secret: string;
  recovered: string;

  getSlices() {
    this.encuestaservice.getS()
      .subscribe( res => {
        console.log('response del server: ', res);
        this.responseSlices = res['message'];
        console.log('mensage en suscribe2: ', this.responseSlices);
      })
  }

}
