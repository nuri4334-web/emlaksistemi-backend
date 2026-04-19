import { SetMetadata } from '@nestjs/common';

// TR: Gerekli rolleri 'roles' metaverisi olarak sisteme işler.
// EN: Sets the required roles as 'roles' metadata in the system.
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);