// nodejs for a deck module. https://nodejs.org/docs/latest/api/modules.html
class Deck{
	constructor(cardDesc){
		this.cardDesc = cardDesc //CONST
		this.propKeys = Object.keys(this.cardDesc) //CONST
		
		let constants = [1]
		let constant = 1
		for(let propIndex = this.propKeys.length-1; propIndex >= 0; propIndex--){
			constant *= this.cardDesc[this.propKeys[propIndex]].length
			constants.unshift(constant)
		}
		
		this.totalCards = constants.shift() //first number is the total number of cards
			
		this.divConstants = constants //CONST
	
	}

}
class Pile{
	constructor(deck){
		cards=[]
		deck=deck
	}
	createAllInCenter(){
		this.create([...Array(this.deck.totalCards).keys()])

	}
	create(cardIdArray){
		for(cardID of cardIdArray){
			this.cards.push(new Card(this.deck,cardID));
		}
	}
	send(card_s='all'){
		card_sType=card_s.constructor.name
		switch(card_sType){
			case "number":
				let temp=cards.splice(card_s)
				return temp.ID
			break;
			case "String":
				let cardArray=[]
				while(this.cards.length){
					cardArray.push(this.cards.pop().ID)
				}
				return cardArray
			break;
			case "Array":
				card_s.sort((a,b)=>{return b-a})
				let cardArray=[]
				let i=0
				for(cardIndex of card_s){
					cardArray.push(this.cards.splice(cardIndex-i,1).ID)
					i++
				}
				return cardArray
			break;
			case "Card":
				return card_s.ID
			break;
		}			
	}
	pop(){
		return this.cards.pop()
	}
	push(card){
		if(card.constructor.name=="Card"){
			this.cards.push(card)
		}else{
			this.create(card)
		}
	}
	shuffle(n=1){
		if(n>0){console.log('cant shuffle negitve times')}
		else{
			while(n){
				let m = this.cards.length, i;
				while(m){
					i = Math.floor(Math.random() * m--);
					[this.cards[m],this.cards[i]]=[this.cards[i],this.cards[m]]
				}
				n--
			}
		}
	}
}
class Card{
	constructor(Deck,cardID){
		if(Deck.totalCards>cardID&&cardID>-1){
			this.ID=cardID
			for(let propIndex = 0; propIndex < Deck.propKeys.length; propIndex++){
				let currentPropertyKey = Deck.propKeys[propIndex]  //'color'
				let currentPropertyList = Deck.cardDesc[currentPropertyKey] //['green','red','blue']
				
				//integer divide to get value
				let valueIndex = Math.floor(cardID / Deck.divConstants[propIndex])
				this[currentPropertyKey] = currentPropertyList[valueIndex]
				
				//subtract
				cardID -= Deck.divConstants[propIndex]*valueIndex
			}
		}
	}
	drawCard(ctx, cardNum){
		console.warn('draw not defined');
	}
	click(){
		console.warn('click not defined');
	}
}
	getProperties(cardNum){
		if(cardNum > Deck.totalCards) return undefined
		

		


	}
		for( let i = 0;i<this.totalCards;i++){this.pile.push(i);}
		this.shuffle(5)
//try/catch to allow use on client and server side
try {
	module.exports = Deck
} catch (err){
	console.log("you must be client side!")
} 

/*let a = new Deck({suit:['♥','♦','♣','♠'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']}) //MSB->LSB

let c = []
for(let b = 0; b<52; b++){
	c.push(a.getProperties(b))
}
console.log(c)*/
