import { ModuleWithProviders } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// Componentes

import { LoginComponent} from './components/login/login.component';
import { HomeComponent } from './components/home/home.component';
import { EncuestaComponent } from './components/encuesta/encuesta.component';
import { AdminComponent } from './components/admin/admin.component';

const appRoutes: Routes = [
	{path: '', component: HomeComponent},
	{path: 'home', component: HomeComponent},
  {path: 'login', component: LoginComponent},
  {path: 'encuesta', component: EncuestaComponent},
  {path: 'admin', component: AdminComponent}
];

export const appRoutingProviders: any[] = [];
export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes);
