import WebSocket from 'ws'

const url = process.env.RELAY_URL || 'ws://127.0.0.1:3456'

const display = new WebSocket(url)
display.on('open', () => {
  display.send(JSON.stringify({ type: 'join', role: 'display' }))
})

display.on('message', (raw) => {
  const msg = JSON.parse(String(raw))
  console.log('display <-', msg.type)
  if (msg.type !== 'joined' || msg.role !== 'display') return
  const { roomId, token } = msg
  const mobile = new WebSocket(url)
  mobile.on('open', () => {
    mobile.send(JSON.stringify({ type: 'join', role: 'mobile', roomId, token }))
  })
  mobile.on('message', (r2) => {
    const m2 = JSON.parse(String(r2))
    console.log('mobile <-', m2.type)
    if (m2.type === 'joined') {
      mobile.send(
        JSON.stringify({
          type: 'command',
          name: 'setPlan',
          payload: {
            plan: [
              { id: '1', title: '热身', durationMin: 1, videoUrl: '', instruction: '说明A' },
              { id: '2', title: '练习', durationMin: 2 },
            ],
            currentItemId: '1',
          },
        }),
      )
      setTimeout(() => {
        mobile.send(JSON.stringify({ type: 'command', name: 'resume' }))
        setTimeout(() => {
          mobile.send(JSON.stringify({ type: 'command', name: 'pause' }))
          setTimeout(() => {
            display.close()
            mobile.close()
            process.exit(0)
          }, 200)
        }, 200)
      }, 200)
    }
  })
})

display.on('error', (e) => {
  console.error(e)
  process.exit(1)
})

setTimeout(() => {
  console.error('timeout')
  process.exit(1)
}, 5000)
