import { ClassConstructor, plainToInstance } from 'class-transformer';

export function plainToInstancesCustom<T, V>(
  cls: ClassConstructor<T>,
  plain: V[],
): T[] {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true,
  });
}

export function plainToInstanceCustom<T, V>(
  cls: ClassConstructor<T>,
  plain: V,
): T {
  return plainToInstance(cls, plain, {
    excludeExtraneousValues: true,
  });
}
