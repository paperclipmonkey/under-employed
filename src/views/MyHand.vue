<template>
  <div class="myhand">
    <h1>My Hand</h1>
    <div class="cards">
        <card @click="$emit('selectCard', $event)" v-for="card in cards" :key="card" :selected="selected === card" :name="card"/>
    </div>
  </div>
</template>
<script>
import Card from '@/views/Card'
export default {
  components: {
    Card
  },
  data () {
    return {}
  },
  props: {
    cards: Array,
    selected: String
  }
}
</script>
<style lang="scss" scoped>
    .myhand {
        width: 100%;
        clear: both;
    }
    .cards {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }
</style>
