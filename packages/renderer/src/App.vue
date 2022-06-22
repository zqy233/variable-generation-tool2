<template>
  <router-view />
</template>
<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  user-select: none;
}
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
  background-color: $bg-color;
}
::-webkit-scrollbar-thumb {
  border-radius: 10px;
  background-color: $blue;
}
::selection {
  background-color: $blue;
  color: $font-color;
}
</style>
