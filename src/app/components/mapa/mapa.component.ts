import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import { Lugar } from 'src/app/interfaces/interfaces';
import { WebSocketService } from 'src/app/services/web-socket.service';


interface RespMarcadores {
  [key: string]: Lugar
}

@Component({
  selector: 'app-mapa',
  templateUrl: './mapa.component.html',
  styleUrls: ['./mapa.component.css']
})
export class MapaComponent implements OnInit {

  mapa: mapboxgl.Map;

  lugares: RespMarcadores = {};
  markersMapbox: { [id: string]: mapboxgl.Marker } = {}


  constructor(
    private http: HttpClient,
    private wsService: WebSocketService
  ) { }

  ngOnInit(): void {
    this.http.get<RespMarcadores>('http://localhost:5000/mapa')
      .subscribe(lugares => {
        console.log(lugares);
        this.lugares = lugares;
        this.crearMapa();
      });

    this.escucharSockets();
  }

  escucharSockets() {

    // marcador-nuevo
    this.wsService.listen('marcador-nuevo')
      .subscribe((marcador: Lugar) => this.agregarMarcador(marcador));

    // marcador-mover
    this.wsService.listen('marcador-mover')
      .subscribe((marcador: Lugar) => {

        this.markersMapbox[marcador.id]
          .setLngLat([marcador.lng, marcador.lat])

      });


    // marcador-borrar
    this.wsService.listen('marcador-borrar')
      .subscribe((id: string) => {
        this.markersMapbox[id].remove();
        delete this.markersMapbox[id];
      });
  }

  crearMapa() {
    (mapboxgl as any).accessToken = 'pk.eyJ1IjoiamdkaWF6MTkiLCJhIjoiY2szaXdwMjEwMDJmMzNkcXlnMnBzanhqYSJ9.p6ChgmSuemH-jtv0_v7QWw';

    this.mapa = new mapboxgl.Map({
      container: 'mapa',
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-97.0902693271637, 18.84890879235489],
      zoom: 16.5
    });

    for (const [id, marcador] of Object.entries(this.lugares)) {
      this.agregarMarcador(marcador);
    }
  }

  agregarMarcador(marcador: Lugar) {
    const h2 = document.createElement('h2');
    h2.innerText = marcador.nombre;

    const h4 = document.createElement('h4');
    h4.innerText = 'lat: ' + marcador.lat + '\nlng: ' + marcador.lng;

    const btnBorrar = document.createElement('button');
    btnBorrar.innerText = 'Borrar';

    const div = document.createElement('div');
    div.append(h2, h4, btnBorrar);


    const customPopup = new mapboxgl.Popup({
      offset: 25,
      closeOnClick: false
    }).setDOMContent(div);

    const marker = new mapboxgl.Marker(
      {
        draggable: true,
        color: marcador.color
      }
    ).setLngLat([marcador.lng, marcador.lat])
      .setPopup(customPopup)
      .addTo(this.mapa);


    marker.on('drag', () => {
      
      const lngLat = marker.getLngLat();
      console.log(lngLat);


      const nuevoMarcador = {
        id: marcador.id,
        ...lngLat
      }

      this.wsService.emit( 'marcador-mover', nuevoMarcador );

    });

    btnBorrar.addEventListener('click', () => {
      marker.remove();
      this.wsService.emit( 'marcador-borrar', marcador.id );
    });

    this.markersMapbox[ marcador.id ] = marker;

  }

  crearMarcador() {

    const customMarker: Lugar = {
      id: new Date().toISOString(),
      lng: -97.0902693271637,
      lat: 18.84890879235489,
      nombre: 'Nuevo Amigo',
      color: '#' + Math.floor(Math.random() * 16777215).toString(16)
    }

    this.agregarMarcador(customMarker);

     // emitir marcador-nuevo
     this.wsService.emit( 'marcador-nuevo', customMarker );

  }

}
