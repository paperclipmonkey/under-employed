<template>
  <div class="pool">
    <h1>Pool</h1>
    <div class="cards">
        <card @click="$emit('selectCard', $event)" v-for="card in cards" :selected="selected === card" :key="card" :name="card"/>
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
    .pool {
        width: 100%;
        clear: both;
    }
    .cards {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
    }
</style>
