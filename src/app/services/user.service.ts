import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { GLOBAL } from './global';
import { User } from '../models/user';
import * as io from 'socket.io-client';
import { environment } from 'src/environments/environment';

@Injectable()
export class UserService{
  public url: string;
	public identity;
  public token;
  public connCounter;
  // creamos el objeto socket
  socket: any;
  readonly urlUser = 'http://localhost:3800/api';
  readonly uri = 'http://localhost:3800';
  readonly entrevistaURI = 'http://localhost:4300'

	constructor(public http: HttpClient){
    this.url = GLOBAL.url;
    //this.urlUser = 'http://localhost:3800/api';
    // //conexión del socket
    // this.socket = io(this.uri)
  }

  // listen(eventName: string) {
  //   return new Observable((subscriber) => {
  //       this.socket.on(eventName, (data) => {
  //         subscriber.next(data)
  //       })
  //   });
  // }

  // emit(eventName: string, data: any) {
  //   this.socket.emit(eventName, data)
  // }
  setupSocketConnection() {
    console.log('Setup socket connection')
    //console.log('identity: ', identity)
    this.socket = io.connect('http://localhost:3800', { forceNew: true})
    this.connCounter = this.connCounter + 1;
    //this.socket.emit('userRole', identity)
  }

  sendIdentitySockets(identity) {
    console.log('Se envia mensaje: ', identity);

    this.socket.emit('userRole', identity)
  }

  coutAdminConnections(counter) {
    console.log('num conn en el cliente: ', counter);
    this.socket.emit('conn', counter)
  }

	register(user: User): Observable<any>{
		const params = JSON.stringify(user);
		const headers = new HttpHeaders().set('Content-Type', 'application/json');

		return this.http.post(this.uri + '/register', params, { headers });
	}

	signup(user: any, gettoken = null): Observable<any>{
		if(gettoken != null){
			user.gettoken = gettoken;
		}

		const params = JSON.stringify(user);
    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    // const socket = io()

		return this.http.post(this.uri + '/login', params, { headers });
	}

	getIdentity(){
		const identity = JSON.parse(localStorage.getItem('identity'));

		if(identity != "undefined"){
			this.identity = identity;
		}else{
			this.identity = null;
		}

		return this.identity;
  }

  getKeysUser() {
    const keysU = JSON.parse(localStorage.getItem('privateKeyUser'));
    console.log('keys de usuario en user service: ', keysU);
    return keysU;
  }

  getAnonymousID() {
    const aID = JSON.parse(localStorage.getItem('anonymousID'));
    console.log('aID del usuario en user service: ', aID);
    return aID;
  }

	getToken(){
		const token = localStorage.getItem('token');

		if(token != "undefined"){
			this.token = token;
		}else{
			this.token = null;
		}

		return this.token;
  }

  getPKey() {
    return this.http.get(this.uri + '/getPubKey')
  }

  signIdentity(message: object) {
    return this.http.post(this.uri + '/sign', message);
  }

  getEntrevista() {
    return this.http.get(this.entrevistaURI + '/home');
  }
}
