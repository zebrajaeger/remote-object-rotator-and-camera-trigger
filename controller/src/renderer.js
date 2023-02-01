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
      const das = $('#delay-after-shot').val();

      window.electronAPI.setSettings(host, spr, ic, focus, trigger, das)
    })

    $('#minus-001').click(_ => {
      window.electronAPI.manualMove(-1)
    })
    $('#minus-010').click(_ => {
      window.electronAPI.manualMove(-10)
    })
    $('#minus-090').click(_ => {
      window.electronAPI.manualMove(-90)
    })
    $('#plus-001').click(_ => {
      window.electronAPI.manualMove(1)
    })
    $('#plus-010').click(_ => {
      window.electronAPI.manualMove(10)
    })
    $('#plus-090').click(_ => {
      window.electronAPI.manualMove(90)
    })

    window.electronAPI.settings((event, host, spr, ic, ft, tt, das) => {
      $('#host').val(host);
      $('#steps-per-revolution').val(spr);
      $('#img-count').val(ic);
      $('#focus-time').val(ft);
      $('#trigger-time').val(tt);
      $('#delay-after-shot').val(das);
    })

    $('#start').click(_ => {
      const ic = $('#img-count').val();
      const focus = $('#focus-time').val();
      const trigger = $('#trigger-time').val();
      const das = $('#delay-after-shot').val();

      console.log('start', ic, focus, trigger, das)
      window.electronAPI.start(ic, focus, trigger, das)
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
