// Decodes the JWT credential Google's Identity Services button returns.
// NOTE: this only reads the payload for display/local-store purposes; it
// does NOT verify the token's signature. Once a backend exists, send the
// raw `credential` string to your server and verify it there (Google's
// google-auth-library `verifyIdToken`, or by hitting
// https://oauth2.googleapis.com/tokeninfo?id_token=...) before trusting it.
export function decodeGoogleCredential(credential) {
  const payloadB64 = credential.split(".")[1];
  const json = atob(payloadB64.replace(/-/g, "+").replace(/_/g, "/"));
  const payload = JSON.parse(decodeURIComponent(escape(json)));
  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
    emailVerified: payload.email_verified,
  };
}
