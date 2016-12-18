var core = {
  menu: {

  },
  rend: {

  },
  webs: {
    ws: new WebSocket(location.origin.replace('http', 'ws')),
    sync: function (id) {
      switch (id) {
        case 0:
          break
      }
    }
  },
  plrs: {
    add: function (id, n, t, s, h, x, y, d) {

    },
    cache: function (id) {

    },
    del: function (id) {

    }
  },
  main: {
    init: function () {
      core.menu.init()
      core.rend.init()
      core.webs.init()
    },
    start: function (n, t) {
      core.webs.start(n, t)
    }
  }
}
