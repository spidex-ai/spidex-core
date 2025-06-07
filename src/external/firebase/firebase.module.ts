import { EEnvKey } from '@constants/env.constant';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FirebaseAuthervice } from 'external/firebase/firebase-auth.service';
import { FIREBASE_ADMIN } from 'external/firebase/firebase.constant';
import * as admin from 'firebase-admin';

@Global()
@Module({
  imports: [],
  providers: [
    {
      provide: FIREBASE_ADMIN,
      useFactory: (configService: ConfigService) => {
        const serviceAccountPath = configService.get(EEnvKey.FIREBASE_SERVICE_ACCOUNT_PATH);

        return admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
        });
      },
      inject: [ConfigService],
    },
    FirebaseAuthervice,
  ],
  exports: [FIREBASE_ADMIN, FirebaseAuthervice],
})
export class FirebaseModule {}
