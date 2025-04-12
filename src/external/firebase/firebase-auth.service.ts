import { Inject, Injectable } from '@nestjs/common';
import { FIREBASE_ADMIN, IFirebaseApp } from 'external/firebase/firebase.constant';

@Injectable()
export class FirebaseAuthervice {
  constructor(
    @Inject(FIREBASE_ADMIN) private readonly firebaseAdmin: IFirebaseApp,
  ) { }

  async verifyIdToken(token: string) {
    return this.firebaseAdmin.auth().verifyIdToken(token);
  }
}
