import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './legal.html'
})
export class LegalComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  
  title = signal('');
  content = signal<string[]>([]);

  ngOnInit(): void {
    this.route.url.subscribe(url => {
      const path = url[0].path;
      this.setupContent(path);
    });
  }

  private setupContent(path: string): void {
    if (path === 'help' || path === 'ayuda') {
      this.title.set('Centro de Ayuda');
      this.content.set([
        '¿Cómo podemos ayudarte hoy? Nuestro equipo está disponible para resolver cualquier duda.',
        'Para consultas técnicas, por favor contacta con soporte@aurea.com.',
        'Puedes encontrar tutoriales sobre cómo gestionar tus activos en la sección de academia.',
        'Si has perdido el acceso a tu cuenta, utiliza el formulario de recuperación en la página de inicio.'
      ]);
    } else if (path === 'privacy' || path === 'privacidad') {
      this.title.set('Política de Privacidad');
      this.content.set([
        'En Aurea, nos tomamos muy en serio la protección de tus datos personales.',
        'Toda la información financiera está cifrada con estándares militares (AES-256).',
        'No compartimos tus datos con terceros sin tu consentimiento explícito.',
        'Cumplimos estrictamente con la normativa GDPR y las leyes locales de protección de datos.',
        'Puedes solicitar la exportación o eliminación de tus datos en cualquier momento desde los ajustes de tu perfil.'
      ]);
    } else if (path === 'terms' || path === 'terminos') {
      this.title.set('Términos y Condiciones');
      this.content.set([
        'Al usar Aurea, aceptas cumplir con nuestros términos de servicio.',
        'Esta plataforma es una herramienta de gestión, no constituye asesoramiento financiero directo.',
        'El usuario es responsable de mantener la confidencialidad de sus credenciales de acceso.',
        'Nos reservamos el derecho de actualizar estos términos para mejorar la seguridad de la plataforma.',
        'Cualquier uso indebido de la API o los servicios resultará en la suspensión inmediata de la cuenta.'
      ]);
    }
  }
}
