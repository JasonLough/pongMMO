var socket = io();

$(document).ready(function() {

	/*
	userdata object (clientside) 
		{ paddleid :
			{
				x : 
				y : 
				team :
			}
		}
	
	*/

	var userdata = {};
	
	var ballDefaultSpeed = 35; //px per sec
	var mySocketid = null;
	var myPaddleid = null;

	$('#gameField').focus();
	$('#gameField').bind('click', function() {
		$('#gameField').focus();
		//console.log('refocus');
	});

	var Paddle = function(x, y, id, team) {
		this.x = x;
		this.y = y;
		this.team = team; //1 (top red), 2 (left green), 3 (right blue), 4 (bottom purple)
		this.paddleid = id;

		switch(team) {
			case 1 : 
				this.orientation = 'horizontalPaddles';
				this.teamColor = '#f00';
				this.modifier = 'left';
				break;
			case 2 :
				this.orientation = 'verticalPaddles';
				this.teamColor = '#0f0';
				this.modifier = 'top';
				break;
			case 3 :
				this.orientation = 'verticalPaddles';
				this.teamColor = '#00f';
				this.modifier = 'top';
				break;
			case 4 :
				this.orientation = 'horizontalPaddles';
				this.teamColor = '#f0f';
				this.modifier = 'left';
				break;
			default :
				console.log('invalid team number : %s', team);
				break;
		}

		this.element = document.createElement('div');
		this.element.setAttribute('id', this.paddleid); // + " " + this.ownerID);
		this.element.setAttribute('class', 'paddles ' + this.orientation);

		var inlineStyle = 'border:2px solid #333;';
		    inlineStyle += 'background-color:' + this.teamColor + ';';
		    inlineStyle += 'top:' + y + 'px;left:' + x + 'px;';

		this.element.setAttribute('style', inlineStyle);

		$('#gameField').append(this.element);		
	};

	//creating paddles. Everyone except the new guy gets this
	socket.on('newGuy', function(data) {
		var aPaddle = new Paddle(data.x, 
		                      data.y, 
		                      data.paddleid, 
		                      data.team); //x, y, paddleid, team

		userdata[data.id] = { team: data.team,
		                      x: data.x,
		                      y: data.y
		                    };

		console.log('creating new guy');
		console.log(data);
	});

	//recieve a list of all current players, create their paddles
	//only the new guy gets this
	socket.on('userdata', function(data) {
		userdata = data.u;

		Object.keys(userdata).forEach(function(e) {
			var aPaddle = new Paddle( userdata[e].x,
				                      userdata[e].y,
				                      e,
				                      userdata[e].team
				);
		});		
	});

	socket.on('moveresponse', function(data) {
		//console.log('recieving data!');
		//console.log(data);

		$('#' + data.p).css(data.m, data.v);

	});

	socket.on('socketid', function(data) {
		//console.log('recieving socketid');
		mySocketid = data.s;
		myPaddleid = data.p;

	});

	socket.on('userleft', function(data) {
		//data.p : pxxx-xxx-xxx-xxx
		var leaver = data.p;
		console.log('leaver : ' + leaver);

		var isuser = Object.keys(userdata).indexOf(leaver);
		console.log('isuser : ' + isuser);

		$('#' + data.p).remove();

		if(isuser !== -1) {
			console.log('removing ' + leaver + " from userdata");

			delete userdata[data.p];			
		}
	});

	$('#gameField').on('mousemove',function(e) {
			
		var vector = {x: e.clientX, y: e.clientY};
		
		var move = {
						v: vector,  
			  			p: myPaddleid,
			  			s: mySocketid
		  		   };

		if(mySocketid !== null)  		  
			socket.emit('move', move);
		//console.log(move);
	});

	socket.on('balldata', function(data) {
		//console.log(data);

		$('.balls').remove();



		Object.keys(data).forEach(function(e) {
			var elem = document.createElement('div');
			elem.setAttribute('class', 'balls');

			var inlineStyle = 'top:' + data[e].y + 'px;left:' + data[e].x + 'px;';

			elem.setAttribute('style', inlineStyle);

			$('#gameField').append(elem);
		});


	});

	socket.on('score', function(msg) {
		$('#score' + msg.t).text(parseInt($('#score' + msg.t).text()) + 1);
		//console.log('score');
	});


});

