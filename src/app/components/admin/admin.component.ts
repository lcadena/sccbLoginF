import { Component, OnInit } from '@angular/core';
import { EncuestaService } from 'src/app/services/encuesta.service';
import { Router } from '@angular/router';
import { UserService } from 'src/app/services/user.service';
import * as bcu from 'bigint-crypto-utils';
import * as bc from 'bigint-conversion';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  public decriptedPollB;
  public decriptedPoll;
  public encu;

  constructor(private encuestaservice: EncuestaService, private router: Router, private userservice: UserService) { }

  ngOnInit() {
    this.decryptPoll()
  }

  decryptPoll() {
    console.log('Decrypt poll function-------')
    this.encuestaservice.recoverPoll()
      .subscribe( res => {
        console.log('response del server: ', res)
        this.decriptedPollB = bc.hexToBigint(res['message'])
        this.decriptedPoll = bc.bigintToText(this.decriptedPollB)
        console.log('encuesta desencriptada: ', this.decriptedPoll)
        this.encu = JSON.parse(this.decriptedPoll);
        document.getElementById("answer1").innerHTML = this.encu['a1'];
        document.getElementById("answer2").innerHTML = this.encu['a2'];
        document.getElementById("answer3").innerHTML = this.encu['a3'];
      })
  }

}
