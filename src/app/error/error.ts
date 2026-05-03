import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '../shared/error-state/error-state';

@Component({
  selector: 'app-error',
  imports: [RouterLink, ErrorState],
  templateUrl: './error.html',
  styleUrl: './error.css',
})
export class ErrorPage {
  handleReload() {
    window.location.reload();
  }
}
