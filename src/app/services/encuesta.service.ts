import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EncuestaService {
  readonly URL_Encuesta = 'http://localhost:3000';
  readonly URL_Login = 'http://localhost:3800';

  constructor(private http: HttpClient) { }

  // Obtener clave publica del servidor de encuestas
  getPublicKey() {
    return this.http.get(this.URL_Encuesta + '/pubK')
  }

  postPoll(message: object) {
    console.log('Envio encuesta: ', message)
    return this.http.post(this.URL_Encuesta + '/penc', message)
  }

  submitPoll(message: object) {
    console.log('Envio mensaje: ', message)
    return this.http.post(this.URL_Encuesta + '/submit', message)
  }

  /** Shamir Scret Sharing */
  getS() {
    return this.http.get(this.URL_Encuesta + '/getSlices')
  }

  recoverPoll() {
    return this.http.get(this.URL_Encuesta + '/decrypt')
  }
}
