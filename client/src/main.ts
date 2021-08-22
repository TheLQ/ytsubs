import { createApp } from 'vue'
import App from './components/App.vue'
import Videos from './components/Videos.vue'
import Subscriptions from './components/Subscriptions.vue'
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Videos },
    { path: '/subscriptions', component: Subscriptions },
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
