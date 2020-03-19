<template>
  <div class="card animated bounceIn" :class="{selected}" @click="$emit('click', name)">
        <div class="card-content">
            <span>{{name}}</span>
        </div>
  </div>
</template>
<script>
export default {
  props: ['name', 'selected']
}
</script>
<style lang="scss" scoped>
    .card {
        width: 100px;
        height: 150px;
        border: 3px solid rgb(46, 45, 45);
        border-radius: 5px;
        margin: 10px;
        overflow: hidden;
        box-shadow: 2px 2px 10px rgb(145, 145, 145);
        background:rgb(206, 80, 80);
        color: #fff;
        font-size: 15px;
        transition-property: all;
        transition-duration: 250ms;
        cursor: pointer;
    }
    .card-content {
          transform: rotate(-15deg);
          padding-top: 30%;
          margin: 5%;
    }
    .card-content span {
        vertical-align: middle;
    }
    .selected {
        border: 3px solid rgb(0, 0, 0);
        background:rgb(194, 48, 48);
    }

    @media (max-width: 500px) {
        .card {
            width: 66px;
            height: 100px;
            font-size: 12px;
        }
    }
</style>
