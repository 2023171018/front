import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface TelemetryData {
  _id: string;
  temperature: number;  // ⚠️ Corregido: el API devuelve "temperature", no "temperatura"
  humidity: number;     // ⚠️ Corregido: el API devuelve "humidity", no "humedad"
  timestamp: string;
  __v: number;
}

interface UpdateStatus {
  ultimoTiempo: number;
  ultimaConsulta: string | null;
  proximaActualizacion: string | null;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent implements OnInit, OnDestroy {

  temperature: number = 0;
  humidity: number = 0;
  telemetryData: TelemetryData[] = [];
  updateStatus: UpdateStatus | null = null;

  private apiUrl = 'https://backend-51r4.onrender.com/api';
  private telemetryInterval: any;
  private statusInterval: any;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTelemetry();
    this.loadUpdateStatus();

    // Actualizar telemetría cada 5 segundos
    this.telemetryInterval = setInterval(() => this.loadTelemetry(), 5000);

    // Actualizar estado de actualización cada 3 segundos
    this.statusInterval = setInterval(() => this.loadUpdateStatus(), 3000);
  }

  ngOnDestroy(): void {
    // Limpiar intervalos al destruir el componente
    if (this.telemetryInterval) {
      clearInterval(this.telemetryInterval);
    }
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
    }
  }

  loadTelemetry() {
    this.http.get<TelemetryData[]>(`${this.apiUrl}/telemetry/all`)
      .subscribe({
        next: (data) => {
          if (data.length > 0) {
            // Ordenar por timestamp descendente (más reciente primero)
            this.telemetryData = [...data].sort((a, b) => {
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            // El más reciente ahora está en la posición 0
            const latest = this.telemetryData[0];

            // ⚠️ IMPORTANTE: Usar los nombres correctos del API
            this.temperature = latest.temperature;  // No "temperatura"
            this.humidity = latest.humidity;        // No "humedad"
          }
        },
        error: (e) => {
          console.error('Error cargando telemetría:', e);
          this.telemetryData = [];
        }
      });
  }

  loadUpdateStatus() {
    this.http.get<UpdateStatus>(`${this.apiUrl}/update/status`)
      .subscribe({
        next: (data) => {
          this.updateStatus = data;
        },
        error: (e) => {
          console.error('Error cargando estado de actualización:', e);
          this.updateStatus = null;
        }
      });
  }

  // Formatea la fecha para mostrar solo hora
  formatTime(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return '---';
    }
  }

  // Formatea la fecha completa
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return '---';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return '---';
    }
  }
}