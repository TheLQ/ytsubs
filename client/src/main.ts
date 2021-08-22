import { createApp } from 'vue'
import App from './components/App.vue'
import Videos from './components/Videos.vue'
import Counter from './components/Counter.vue'
import { createRouter, createWebHashHistory } from "vue-router";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: Videos },
    { path: '/about', component: Counter },
  ]
})

const app = createApp(App)
app.use(router)
app.mount('#app')
