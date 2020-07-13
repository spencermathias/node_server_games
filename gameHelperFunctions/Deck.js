// nodejs for a deck module. https://nodejs.org/docs/latest/api/modules.html
var isClient=false
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
		this.pile =[]
		for( let i = 0;i<this.totalCards;i++){this.pile.push(this.getProperties(i));}
		if(!isClient){this.shuffle(5)}
		this.dfltCardProps=undefined
	}
	
	getProperties(cardNum){
		if(cardNum > this.totalCards) return undefined
		
		let cardProp = {}
		cardProp.ID=cardNum
		for(let propIndex = 0; propIndex < this.propKeys.length; propIndex++){
			let currentPropertyKey = this.propKeys[propIndex]  //'color'
			let currentPropertyList = this.cardDesc[currentPropertyKey] //['green','red','blue']
			
			//integer divide to get value
			let valueIndex = Math.floor(cardNum / this.divConstants[propIndex])
			cardProp[currentPropertyKey] = currentPropertyList[valueIndex]
			
			//subtract
			cardNum -= this.divConstants[propIndex]*valueIndex
		}
		return cardProp
	}

	deal(n=1){
		//debugger
		let hand=[]
		while(n){
			hand.push(this.pile.pop());n--;
		}
		console.log(hand)
		return hand
	}

	returnCard(cardID){
		let index = Math.floor(Math.random()*this.pile.length)
		if(this.pile.length==0){
			this.pile.push(cardID)
		}else{
			this.pile.splice(index,0,cardID)
		}
	}

	shuffle(n=1){
		while(n){
			let m = this.pile.length, i;
			while(m){
				i = Math.floor(Math.random() * m--);
				[this.pile[m],this.pile[i]]=[this.pile[i],this.pile[m]]
			}
			n--
		}
	}
	setDfltCardProps(width,funct2changePropsByCard){
		//if(funct2changePropsByCard==undefined)
		this.dfltCardProps={
			width:width,
			hwRatio:1.3,
			text:'',
			fontSize:50,
			fillColor:'#ffe0b3',
			outlineColor:'#000000',
			textColor:'#000000',
			textOutlineColor:'#000000',
			textSlant:false,
			funct2changePropsByCard:funct2changePropsByCard
		}
	}
	makeCardObject(cardNum, x, y){
		let dflt=this.dfltCardProps
		let newProps=this.dfltCardProps.funct2changePropsByCard(this.pile[cardNum])
		for(let prop in newProps){
			if(dflt[prop]!=undefined){
				dflt[prop]=newProps[prop]
			}
		}
		let newCard= new Card(this.pile[cardNum],x,y,dflt.width,dflt.width*dflt.hwRatio,dflt.text,dflt.fontSize,dflt.fillColor,dflt.outlineColor,dflt.textColor,dflt.textOutlinecolor,dflt.textSlant)
		return newCard
	}
}
class Card {
	constructor(deckProps,x, y, width, height, text = "button", fontSize = 50, fillColor='#ffe0b3', outlineColor='#000000', textColor='#000000', textOutlineColor='#000000', textSlant = false){
		this.deckProps=deckProps
		this.updateSize(x,y,width,height);
		this.fillColor = fillColor;
		this.outlineColor = outlineColor;
		this.textColor = textColor;
		this.textOutlinecolor = textOutlineColor;
		this.fontSize = fontSize;
		this.text = text;
		this.textSlant = textSlant;
		this.visible = true;
	}
	
	updateSize(x,y,width,height){
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.clickArea = {minX: x - width/2, minY: y - height/2, maxX: x + width/2, maxY: y + height/2};
	}
	
	draw(ctx){
		if(this.visible){
			ctx.save();
			ctx.textAlign="center";
			ctx.textBaseline = "middle";
			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.outlineColor;
			this.roundRect(ctx, this.clickArea.minX, this.clickArea.minY, this.width, this.height, this.width/8, this.fillColor != undefined, this.outlineColor != undefined);

			//draw number
			ctx.font = '' + this.fontSize + "px Arimo" //Arial Black, Gadget, Arial, sans-serif";
			ctx.fillStyle = this.textColor;
			ctx.strokeStyle = this.textOutlineColor;
			ctx.translate(this.x, this.y);
			if(this.textSlant){
				ctx.rotate(Math.atan(this.height/this.width));
			}
			if(this.textColor != undefined){
				ctx.fillText(this.text,0,0);//multiLine(ctx,this.text,this.fontSize,0)//;this.width);
			}
			if(this.textOutline != undefined){
				ctx.strokeText(this.text, 0, 0);
			}
			ctx.restore();
		}
	}
	click(){
		console.log('not overloaded yet')
	}
	roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  		ctx.save()
		if (typeof radius === 'undefined') {
			radius = 5;
		}
		if (typeof radius === 'number') {
			radius = {tl: radius, tr: radius, br: radius, bl: radius};
		} else {
			var defaultRadius = {tl: 0, tr: 0, br: 0, bl: 0};
			for (var side in defaultRadius) {
				radius[side] = radius[side] || defaultRadius[side];
			}
		}
		ctx.beginPath();
		ctx.moveTo(x + radius.tl, y);
		ctx.lineTo(x + width - radius.tr, y);
		ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
		ctx.lineTo(x + width, y + height - radius.br);
		ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
		ctx.lineTo(x + radius.bl, y + height);
		ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
		ctx.lineTo(x, y + radius.tl);
		ctx.quadraticCurveTo(x, y, x + radius.tl, y);
		ctx.closePath();
		if (fill) {
			ctx.fillStyle=fill
			ctx.fill();
		}
		if (stroke) {
			ctx.strokeStyle=stroke
			ctx.stroke();
		}
		ctx.restore()
	}
} 
function reply(){console.log('test')}
//try/catch to allow use on client and server side
try {
	module.exports = Deck
} catch (err){
	isClient=true
	console.log("you must be client side!")
} 

/*let a = new Deck({suit:['♥','♦','♣','♠'], number:['A',2,3,4,5,6,7,8,9,10,'J','Q','K']}) //MSB->LSB

let c = []
for(let b = 0; b<52; b++){
	c.push(a.getProperties(b))
}
console.log(c)*/
