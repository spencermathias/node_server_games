var publicAddress = Addresses.publicAddress;
//var internalAddress = Addresses.localAddress;
console.log(window.location.href)
//const socket = io('/my-namespace');

var socket = io(publicAddress);