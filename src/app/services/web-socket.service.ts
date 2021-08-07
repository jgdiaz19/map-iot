import { Injectable } from '@angular/core';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {

  public socketStatus = false;
  public usuario = null;

  constructor(
    private socket: Socket
  ) {
    this.checkStatus();
    console.log('CTOR SERVICE');
    
  }

  //Verifca el status de la conexion con el web socket
    checkStatus() {

      this.socket.on('connect', () => {
        console.log('Conectado al servidor');
        this.socketStatus = true;
      });

      this.socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
        this.socketStatus = false;
      });
    }


    // Emite informacion a todos los clientes que estan conectados al web socket
    emit( evento: string, payload?: any, callback?: Function ) {

      console.log('Emitiendo', evento);
      this.socket.emit( evento, payload, callback );

    }

    // escucha cambios emitidos al web socket por otros clientes
    listen( evento: string ) {
      return this.socket.fromEvent( evento );
    }
  
}
