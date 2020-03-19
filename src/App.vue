<template>
  <div id="app">
    <h1>Under Employed</h1>
    <h2> Today, you're interviewing for: </h2>
    
    <div class="jobholder">
      <job :name="round.job"/>
    </div>

    <!-- <router-view/> -->
    <template v-if="!player.dealer">
      <my-hand @selectCard="selectedHandCard = $event" :selected="selectedHandCard" :cards="hand" />
      <pool @selectCard="selectedPoolCard = $event" :selected="selectedPoolCard" v-if="round.mode === 'deck'" :cards="round.qualificationPool" />
      <countdown/>
    </template>

    <dealer v-if="player.dealer" @selectCard="selectedHandCard = $event" :selected="selectedHandCard" :cards="hand" />

    <played-cards v-if="round.mode === 'interview'" :cards="round.shownCards" />
  </div>
</template>
<script>
import { mapState, mapActions } from 'vuex'
import myHand from '@/views/MyHand'
import pool from '@/views/Pool'
import dealer from '@/views/Dealer'
import playedCards from '@/views/PlayedCards'
import job from '@/views/Job'
import countdown from '@/views/Countdown'

export default {
  components: {
    myHand,
    pool,
    playedCards,
    dealer,
    job,
    countdown
  },
  data () {
    return {
      selectedPoolCard: '',
      selectedHandCard: ''
    }
  },
  computed: {
    ...mapState(['hand', 'round', 'player'])
  },
  watch: {
    selectedHandCard () {
      this.playCard()
    },
    selectedPoolCard () {
      this.swapCards()
    }
  },
  methods: {
    playCard () {
      if (this.round.mode === 'deck') {
        console.log('swapping cards only')// swapping cards only.
        this.swapCards()
        return
      }
      this.$store.dispatch('playCard', { handCard: this.selectedHandCard })
    },
    swapCards () {
      if (!this.selectedHandCard || !this.selectedPoolCard) return
      this.$store.dispatch('swapCards', { handCard: this.selectedHandCard, poolCard: this.selectedPoolCard })
      this.selectedPoolCard = ''
      this.selectedHandCard = ''
    },
    ...mapActions(['setDealer'])
  },
  mounted () {
    window.addEventListener('keyup', (event) => {
      // If down arrow was pressed...
      if (event.keyCode === 68) { // d button
        this.setDealer()
      }
    })
  }
}
</script>
<style lang="scss">
@import '~animate.css';

h1 {
  clear: both;
}
.reset, .next {
  float:right;
  margin: 5px;
  padding: 5px;
}

.jobholder {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-around;
}

#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;

  a {
    font-weight: bold;
    color: #2c3e50;

    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
