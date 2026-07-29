export class DevTokenSystem {
  constructor() {
    this.isAuthorized = false;
    this.secretToken = 'admin123';
    this.checkUrlQuery();
  }

  checkUrlQuery() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('devToken') || urlParams.get('dev');
      if (token === this.secretToken) {
        this.isAuthorized = true;
      }
    } catch (e) {}
  }

  authenticate(inputToken) {
    if (inputToken === this.secretToken) {
      this.isAuthorized = true;
      return true;
    }
    return false;
  }
}
