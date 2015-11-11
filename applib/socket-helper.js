/*
	userids object (serverside)
	{ 
		socketid : 
			{
				paddleid :
			}
	}

	userdata object (serverside AND clientside)
	{ 
		paddleid :
			{
				x :
				y :
				team :
			}
	}

	balldata object (server generated, sent to all clients every n seconds)
	{
		ballid :
			{
				x :
				y :
				vector :
				magnitude :
			}
	}

	send to specific socket :
		this.io.to(socket.id).emit('socketid', {s: socket.id});

	send to everyone 
		io.sockets.emit('an event sent to all connected clients');

	send to all except current connection
		???socket.broadcast.emit('reply', msg);
*/

module.exports = {

	userids : {},
	userdata : {},
	balldata : {},
	io : null,
	teams : null,
	self : null,
	interval : null,
	ballinterval : null,

	init : function (server) {
		self = this;
		this.teams = 0;
		this.io = require('socket.io')(server);		

		this.io.on('connection', function(socket){ 
			
	  		//console.log(socket.id + ' JOINED'); //a random string like 'hHn4vAQ_SDgkljhDGLHDSG'
		  	self.teams++;
		  	console.log('created player for team : ' + self.teams);

			var player = {
				paddleid : 'pxxx-xxx-xxx-xxx'.replace(/x/g, function() { return Math.random() * 10 | 0 } ),
				team : self.teams %4 +1,
				x : Math.random() * 1000 + 100 | 0,
				y : Math.random() * 800 + 100 | 0
			};

			//put player paddles within 100 px of their goal
			switch(player.team) {
				case 1 :
					player.x = Math.random() * 1000 + 100 | 0;
					player.y = Math.random() * 100 + 100 | 0;
					break;

				case 2 :
					player.x = Math.random() * 100 + 100 | 0;
					player.y = Math.random() * 700 + 100 | 0;
					break;

				case 3 :
					player.x = Math.random() * 100 + 900 | 0;
					player.y = Math.random() * 700 + 100 | 0;
					break;

				case 4 :
					player.x = Math.random() * 1000 + 100 | 0;
					player.y = Math.random() * 100 + 680 | 0;
					break;

				default:
					console.log('player team dosent exist : ' + player.team);//should never get ran
					break;
			}

		 	//console.log('newID:%s team:%s x:%s y:%s',player.paddleid, player.team, player.x, player.y);
		  	
		  	//send new guys data to everyone else so they can update their local users object copy
		  	socket.broadcast.emit('newGuy', player);

		  	//add the socketid {} to userids object //keep private
		  	self.userids[socket.id] = { paddleid : player.paddleid };

		  	//add the paddleid {} to the userdata object //share
		  	self.userdata[player.paddleid] = {team: player.team, x: player.x, y: player.y };

		  	//send the new guy the current userdata 
		  	self.io.to(socket.id).emit('userdata', {u: self.userdata});

		  	//...and his socketid
		  	self.io.to(socket.id).emit('socketid', {s: socket.id, p: player.paddleid});

		  	if( self.ballinterval === null) {
		  		self.ballinterval = setInterval(function(){
			  		if(Object.keys(self.balldata).length < 30) {
			  			var ballid = 'bxxx-xxx'.replace(/x/g, function() { return Math.random() * 10 | 0 } );		  	
					  	self.balldata[ballid] = {				
							x : Math.random() * 100 + 500 | 0,
							y : Math.random() * 100 + 400 | 0,
							mag : Math.random() * 10 + 20 | 0, //pixels per sec
							angle : Math.random() * 360 | 0 //direction in degrees
						};		  	
			  		}
		  		}, 1000)//set this to like 5 and see the crazy			
		  	}

		  	//set timer to iterate through all balls and move them every n seconds
		  	if( self.interval === null ) {
		  		self.interval = setInterval(function() {
				  	//move the balls
				  	Object.keys(self.balldata).forEach(function(e){
				  		//console.log(self.balldata[e]);
				  		var obj = self.balldata[e];
				  		var rads = obj.angle * 0.017453292519;
				  		obj.x = Math.floor(obj.x + obj.mag * Math.cos(rads));
				  		obj.y = Math.floor(obj.y + obj.mag * Math.sin(rads));

				  		//handle edge collisions
				  		if( obj.x < 10 ) {
				  			obj.angle = Math.random() * 160 - 80 | 0;
				  			obj.x = 11;
				  		}

				  		if( obj.x > 1145 ) {
				  			obj.angle = Math.random() * 360 | 0;
				  			obj.x = 1144;
				  		}

				  		if( obj.y < 10 ) {
				  			obj.angle = Math.random() * 360 | 0;
				  			obj.y = 11;
				  		}

				  		if( obj.y > 845 ) {
				  			obj.angle = Math.random() * 360 | 0;
				  			obj.y = 844;
				  		}

				  		//handle paddle collisions
				  		Object.keys(self.userdata).forEach(function(e) {
				  			var paddlex = self.userdata[e].x;
				  			var paddley = self.userdata[e].y;

				  			var fieldsize = 45; //essentially, a square with the paddle in middle
				  			//console.log(obj.x + ' ' + obj.y + ' : ' + paddlex + ' ' + paddley);
				  			if( (obj.x >= paddlex - fieldsize) &&
				  			    (obj.x <= paddlex + fieldsize) &&
				  			    (obj.y >= paddley - fieldsize) &&
				  			    (obj.y <= paddley + fieldsize) ) {
				  				//console.log('bounce');
				  				obj.angle = obj.angle - 180 | 0;
				  			}
				  		});

				  		//handle goal collisions
				  		//goals are 470x100
				  		//field is 1200x900
				  		//ball is 45x45, measurement is to top left corner

				  		//red (team 1)
				  		if( (obj.x >= 365) &&
			  			    (obj.x <= 835) &&
			  			    (obj.y <= 100) ) {
			  				//console.log('score on red');
			  				//console.log(self.balldata[e]);
			  				self.io.sockets.emit('score', {t:1});
			  				delete self.balldata[e];
			  			}

			  			//green (team 2)
			  			if( (obj.x <= 100) &&
			  			    (obj.y <= 685) &&
			  			    (obj.y >= 215) ) {
			  				//console.log('score on green');
			  				//console.log(self.balldata[e]);
			  				self.io.sockets.emit('score', {t:2});
			  				delete self.balldata[e];
			  			}

			  			//blue (team 3)
			  			if( (obj.x >= 1100) &&
			  			    (obj.y <= 685) &&
			  			    (obj.y >= 210) ) {
			  				//console.log('score on blue');
			  				//console.log(self.balldata[e]);
			  				self.io.sockets.emit('score', {t:3});
			  				delete self.balldata[e];
			  			}

			  			//purple (team 4)
			  			if( (obj.x >= 365) &&
			  			    (obj.x <= 835) &&
			  			    (obj.y >= 800) ) {
			  				//console.log('score on purple');
			  				//console.log(self.balldata[e]);
			  				self.io.sockets.emit('score', {t:4});
			  				delete self.balldata[e];
			  			}
				  	});

				  	//send balldata to all clients
				  	self.io.sockets.emit('balldata', self.balldata);
				  	//console.log('emitting balldata');

			  	}, 100);
		  	}

			socket.on('move', function(msg) {
				// msg.v = vector {x: , y: }
				// msg.p = paddleid (xxx-xxx-xxx-xxx) where x is 0-9
				// msg.s = super secret socketid

				//console.log('move recieved. msg: %s %s %s', msg.v, msg.p, msg.s);

				//make sure paddleid and socketid match up inside users[], otherwise discard move
				if(Object.keys(self.userids).indexOf(msg.s) === -1) {
					//console.log('invalid match');
					return;
				}

				//lookup team number and set cssModifier / vector

				//console.log(self.userdata);
				if( ( self.userdata[msg.p].team === 2 ) || ( self.userdata[msg.p].team === 3 ) ){
					vector = msg.v.y;
					modifier = 'top';
					self.userdata[msg.p].y = msg.v.y;
				} else {
					var vector = msg.v.x;
					var modifier = 'left';
					self.userdata[msg.p].x = msg.v.x;
				}

				self.io.sockets.emit('moveresponse', { v: vector,  //vector (x | y)
					                                   m: modifier,  //cssModifier ('top' | 'left')
					                                   p: msg.p   //paddleid
					                               });
			});

			socket.on('disconnect', function() {				
				//console.log(socket.id + ' LEFT paddleid: ' + self.users[socket.id].paddleid);
				var leaversPaddleId = self.userids[socket.id].paddleid;
				//console.log('paddleid LEFT : ' + leaversPaddleId);

				//remove that paddleid entry from userids {} and userdata {}


				//console.log('--userdata before removal---');
				//console.log(Object.keys(self.userdata).toString());				

				delete self.userdata[leaversPaddleId];

				//console.log('--userdata after removal---');
				//console.log(Object.keys(self.userdata).toString());				

				//console.log('--userids before removal---');
				//console.log(Object.keys(self.userids).toString());

				delete self.userids[socket.id];

				//console.log('--userids after removal---');
				//console.log(Object.keys(self.userids).toString());
				
				//update everyone else
				self.io.sockets.emit('userleft', { p : leaversPaddleId });
			});
		});
	}
}


