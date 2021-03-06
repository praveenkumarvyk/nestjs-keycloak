import Keycloak from 'keycloak-connect';
import { DynamicModule, Module, Provider } from '@nestjs/common';
import {
  KeycloakAxiosProvider,
  KEYCLOAK_AXIOS
} from './providers/axios.provider';
import { KEYCLOAK_OPTIONS, KEYCLOAK_INSTANCE } from './constants';
import { KeycloakAsyncOptions } from './types';
import { KeycloakService } from './keycloak.service';

export * from './authenticate';
export * from './constants';
export * from './decorators/public.decorator';
export * from './decorators/resource.decorator';
export * from './decorators/roles.decorator';
export * from './decorators/scopes.decorator';
export * from './guards/auth.guard';
export * from './guards/resource.guard';
export * from './keycloak.service';
export * from './types';

declare interface KeycloakOptions {
  authServerUrl: string;
  clientId?: string;
  realm?: string;
  realmPublicKey?: string;
  secret?: string;
}

@Module({})
export class KeycloakModule {
  public static register(options: KeycloakOptions): DynamicModule {
    return {
      module: KeycloakModule,
      providers: [
        KeycloakAxiosProvider,
        KeycloakService,
        this.keycloakProvider,
        {
          provide: KEYCLOAK_OPTIONS,
          useValue: options
        }
      ],
      exports: [
        KEYCLOAK_OPTIONS,
        KeycloakService,
        this.keycloakProvider,
        KEYCLOAK_AXIOS
      ]
    };
  }

  public static registerAsync(
    asyncOptions: KeycloakAsyncOptions
  ): DynamicModule {
    return {
      module: KeycloakModule,
      imports: asyncOptions.imports || [],
      providers: [
        KeycloakAxiosProvider,
        KeycloakService,
        this.createOptionsProviders(asyncOptions),
        this.keycloakProvider
      ],
      exports: [
        KEYCLOAK_OPTIONS,
        KeycloakService,
        this.keycloakProvider,
        KEYCLOAK_AXIOS
      ]
    };
  }

  private static createOptionsProviders(asyncOptions: KeycloakAsyncOptions) {
    if (!asyncOptions.useFactory) {
      throw new Error("registerAsync must have 'useFactory'");
    }
    return {
      inject: asyncOptions.inject || [],
      provide: KEYCLOAK_OPTIONS,
      useFactory: asyncOptions.useFactory
    };
  }

  private static keycloakProvider: Provider = {
    provide: KEYCLOAK_INSTANCE,
    useFactory: (options: KeycloakOptions) => {
      const keycloak: any = new Keycloak({}, options as any);
      keycloak.accessDenied = (req: any, _res: any, next: any) => {
        req.resourceDenied = true;
        next();
      };
      return keycloak;
    },
    inject: [KEYCLOAK_OPTIONS]
  };
}
