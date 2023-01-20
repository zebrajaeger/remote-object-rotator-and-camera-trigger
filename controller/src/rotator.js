const axios = require('axios')

class Rotator {
  host;
  protocol;

  constructor(host) {
    this.host = host;
    this.protocol = 'http://';
  }

  async readStatus() {
    return new Promise((resolve, reject) => {
      axios
      .get(`${this.protocol}${this.host}/status`)
      .then((res) => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.status)
        }
      })
      .catch((err) => {
        reject(err.message)
      })
    })
  }

  async moveAndWait(steps) {
    await this.move(steps);
    return await this.waitForStop();
  }

  async move(steps) {
    return new Promise((resolve, reject) => {
      axios
      .post(`${this.protocol}${this.host}/move`, {steps, 'off-after-move': false})
      .then((res) => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.status)
        }
      })
      .catch((err) => {
        reject(err.message)
      })
    })
  }

  async shot(focus, trigger) {
    return new Promise((resolve, reject) => {
      axios
      .post(`${this.protocol}${this.host}/camera`, {focus, trigger})
      .then((res) => {
        if (res.status === 200) {
          resolve(res.data);
        } else {
          reject(res.status)
        }
      })
      .catch((err) => {
        reject(err.message)
      })

    })
  }

  async waitForStop() {
    const self = this;
    return new Promise((resolve, reject) => {
      function x() {
        self.readStatus().then(s => {
          if (s.running) {
            setTimeout(x, 250)
            console.log('running...')
          } else {
            console.log('...stopped')
            resolve(s.pos)
          }
        }).catch(e => {
          reject(e)
        })
      }

      x();
    })
  }
}

module.exports = {Rotator}
