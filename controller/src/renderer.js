// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// No Node.js APIs are available in this process because
// `nodeIntegration` is turned off. Use `preload.js` to
// selectively enable features needed in the rendering
// process.
;(async () => {
  window.addEventListener('DOMContentLoaded', () => {
    $('#set-settings').click(_ => {
      const host = $('#host').val();
      const spr = $('#steps-per-revolution').val();
      const ic = $('#img-count').val();
      const focus = $('#focus-time').val();
      const trigger = $('#trigger-time').val();

      window.electronAPI.setSettings(host, spr, ic, focus, trigger)
    })

    window.electronAPI.settings((event, host, spr, ic, ft, tt) => {
      $('#host').val(host);
      $('#steps-per-revolution').val(spr);
      $('#img-count').val(ic);
      $('#focus-time').val(ft);
      $('#trigger-time').val(tt);
    })

    $('#start').click(_ => {
      const ic = $('#img-count').val();
      const focus = $('#focus-time').val();
      const trigger = $('#trigger-time').val();

      console.log('start', ic, focus, trigger)
      window.electronAPI.start(ic, focus, trigger)
    })

    $('#stop').click(_ => {
      window.electronAPI.stop();
    })

    window.electronAPI.status((event, value) => {
      /*
      contract:
      { running: true, index: 3, amount: 12, state: [FOCUSSING,TRIGGERING,MOVING,DONE]}
       */
      $('#status').text(`${value.state} ${value.index}/${value.amount}`);
    })

    window.electronAPI.getSettings();
  })
})()
