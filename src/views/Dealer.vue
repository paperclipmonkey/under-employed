<template>
  <div class="dealer">
    <h1>Dealer questions</h1>

    <button class='next' @click="next">Next</button>
    <button class='reset' @click="reset">Deal</button>

    Number of interviewees: {{Object.entries(round.players).length - 1}}
    <div class="cards">
        <card @click="$emit('selectCard', $event)" v-for="card in cards" :key="card" :selected="selected === card" :name="card"/>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import Card from '@/views/Card'
export default {
  components: {
    Card
  },
  data () {
    return {}
  },
  computed: {
    ...mapState(['round'])
  },
  props: {
    cards: Array,
    selected: String
  },
  methods: {
    ...mapActions(['reset', 'next'])
  }
}
</script>
<style lang="scss" scoped>
    .dealer {
        width: 100%;
        clear: both;
    }
    .cards {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-around;
    }
</style>
