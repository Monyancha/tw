window.onload = start;
window.onresize = function(event) {
    // set width of fixed friendlist heading
	var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
	document.getElementById("friendsListHeadingCont").style.width = width + "px";
};

// GLOBALS USED WITHIN APP
var accountRef;
var uidKey;

// live editor
var collabID;
var pusherID;
var pusherChannel;

var notificationRef;
var socialRef;

var loadSocial

var notificationStatus;
var availablityModeStatus;
var availabilityModeCheck;
function start() {

	// init firebase
	const config = {
	    apiKey: "AIzaSyA-hRi2HALi-xXdym3J9ov5NcplIgujH7I",
	    authDomain: "twproject-13f58.firebaseapp.com",
	    databaseURL: "https://twproject-13f58.firebaseio.com",
	    projectId: "twproject-13f58",
	    storageBucket: "twproject-13f58.appspot.com",
	    messagingSenderId: "744116401403"
	};
	firebase.initializeApp(config);

	collabID = getUrlParameter('id');
	if (!collabID) {
	    location.search = location.search
	    ? '&id=' + getUniqueId() : 'id=' + getUniqueId();
	    return;
	}

	function getUniqueId () {
	    return 'private-' + Math.random().toString(36).substr(2, 9);
	 }

	 function getUrlParameter(name) {
	    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
	    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
	    var results = regex.exec(location.search);
	    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
	};

	// init tooltips
	$(document).ready(function(){
    	$('[data-toggle="tooltip"]').tooltip();   
	});

	// allows dropdown to not dismiss on click
	$('#friendRequestsMenu').bind('click', function (e) { e.stopPropagation() });
	$('#notificationMenu').bind('click', function (e) { e.stopPropagation() });
	$('#profileModalSettingsMenu').bind('click', function (e) { e.stopPropagation() });

	// load user
	firebase.auth().onAuthStateChanged(function(user) {
		if (user) {
		    uidKey = user.uid;
		    accountRef = firebase.database().ref("accounts/" + uidKey);
		    accountRef.once("value", function(snapshot) {

		    	/////// RUN PROFILE FOR TESTING ///////
		    	profile();
		    	/////////////////////////////////////

		    	// set account UI and avatar image
		    	if (snapshot.val().Avatar_url != undefined) {
		    		document.getElementById("userAccount").innerHTML = "<img id='userAvatar' src=" + snapshot.val().Avatar_url + " alt='Avatar'> " + snapshot.val().First_Name + " " + snapshot.val().Last_Name + " <i data-feather='chevron-down'></i>";
		    		document.getElementById("profileImg").src = snapshot.val().Avatar_url;
		    	}

		    	else {
		    		document.getElementById("userAccount").innerHTML = "<img id='userAvatar' src='/img/avatar.png' alt='Avatar'> " + snapshot.val().First_Name + " " + snapshot.val().Last_Name + " <i data-feather='chevron-down'></i>";
		    		document.getElementById("profileImg").src = "/img/avatar.png";
		    	}
		    	
		    	// load icon module
		    	feather.replace();

		    	// load notification status
		    	notificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications");
		    	notificationRef.once("value", function(snapshot) {
		    		// set value if first sign in
		    		if (snapshot.val() === null) {
		    			notificationRef.update({
		    				Notification_Status: "on"
		    			});
		    		}
		    		else {
		    			notificationStatus = snapshot.val().Notification_Status;
		    			toggleNotifications();
		    		}
		    	});

		    	// load social data
		    	socialRef = firebase.database().ref("accounts/" + uidKey + "/social");
		    	socialRef.once("value", function(snapshot) {
		    		// set value if first sign in
		    		if (snapshot.val() === null ) {
		    			socialRef.update({
		    				Mode: "publicmode"
		    			});
		    		}
		    		else {
		    			availabilityModeStatus = snapshot.val().Mode;
		    			availabilityMode();
		    		}
		    	});

		    	// load friend requests
		    	loadFriendRequests();

		    	// load notifications
				loadNotifications();

				// load friends
				loadFriends();

				// load overview on profile load
				document.getElementById("overviewTrigger").click();
				
				// file upload on avatar click
				$('#profileImg').click(function(){ $('#avatarUpload').trigger('click'); });

				// upload avatar
				document.getElementById("avatarUpload").addEventListener("change", uploadAvatar);
				
		    	// fade in dashboard
		    	document.getElementById("loadingCover").classList.add("fadeOut");
	    		setTimeout(function() {
	    			document.getElementById("loadingCover").classList.remove("fadeOut");
		    		document.getElementById("loadingCover").style.display = "none";
		    		document.getElementById("body").classList.add("fadeIn");
		    	},  100);
		    });
		}
	});

	// sign out listener
	document.getElementById("signOut").addEventListener("click", signOut);

	// user menu
	document.getElementById("userAccount").addEventListener("click", openMenu);

	// notifications
	document.getElementById("notificationsOff").addEventListener("click", toggleNotifications);

	// trigger new project event
	document.getElementById("newProjectTrigger").addEventListener("click", openNewProject);

	// trigger my projects event
	document.getElementById("myProjectsTrigger").addEventListener("click", openMyProjects);

	// trigger social events
	document.getElementById("socialTrigger").addEventListener("click", social);

	// trigger profile events
	document.getElementById("profileTrigger").addEventListener("click", profile);
}

/************************** FUNCTIONS USED WITHIN APP *******************************/

// function to capitalize first letters, used within app
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

// styles for user dropdown menu
function openMenu() {
	document.getElementById("userAccountMenu").classList.add("fadeIn");
	setTimeout(function() {
		document.getElementById("userAccountMenu").classList.remove("fadeIn");
	}, 600);
}

// clear and refresh dashboard on change
function clear() {
	var childs = document.getElementById("dashboardContainer").childNodes;
	for (var i = 0; i < childs.length; i++) {
		if (childs[i].tagName === "DIV") {
			childs[i].style.display = "none";
		}
	}
}

/************************* END FUNCTIONS USED WITHIN APP ****************************/



/********************************** SOCIAL *****************************************/
function social() {
	// clear dashboard container
	clear();

	// display containers
	document.getElementById("socialMain").style.display = "block";
	document.getElementById("socialAside").style.display = "block";

    // set width of fixed friendlist heading
	var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
	document.getElementById("friendsListHeadingCont").style.width = width + "px";


	// availablity mode
	document.getElementById("toggleMode").addEventListener("click", availabilityMode);

	// fixed search bar for friend list
	document.getElementById("socialAside").addEventListener("scroll", positionSearchbar);

	// toggle search friends
	document.getElementById("toggleSearch").addEventListener("click", showSearchbarFriends);

	// filter friends
	document.getElementById("filterFriends").addEventListener("keyup", filterFriends);

	// add friend event
	document.getElementById("addFriend").addEventListener("click", addFriend);

	// set amount of online friends
	var online = document.getElementsByClassName("online").length;
	document.getElementById("amountOnline").innerHTML = online + " online";
}

// load friend requests, run at start
function loadFriendRequests() {
	// count to controll flow of divider
	var count = 0;
	var userKey;

	// request ref
	var friendRequestRef = firebase.database().ref("accounts/" + uidKey + "/friend_requests");
	friendRequestRef.once("value", function(snapshot) {
		// create requests for each value
		snapshot.forEach((child) => {
			count++;
			userKey = child.key;

			// only create divider if there are more than one request
			if (count > 1) {
				// create divider
				var divider = document.createElement("div");
				divider.classList.add("dropdown-divider") + divider.classList.add("friendRequestDivider");
				document.getElementById("friendRequestsMenu").appendChild(divider);
			}

			// create container
			var cont = document.createElement("div");
			cont.classList.add("pendingFriendRequest") + cont.classList.add("animated") + cont.classList.add("fadeIn");
			cont.id = "friendRequestCont-" + userKey;

			// create avatar and heading
			var headingCont = document.createElement("div");
			var avatar = document.createElement("img");
			avatar.id = "friendRequest-" + child.key;
			avatar.classList.add("pendingFriendRequestAvatar");
			avatar.addEventListener("click", openProfile)

			// avatar img
			var requestRef = firebase.database().ref("accounts/" + child.key)
			requestRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					avatar.src = snapshot.val().Avatar_url;
				}

				else {
					avatar.src = "/img/avatar.png";
				}
			});
			
			var headingSpan = document.createElement("span");
			headingSpan.classList.add("pendingFriendRequestName");
			headingSpan.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

			// set heading
			headingCont.appendChild(avatar);
			headingCont.appendChild(headingSpan);
			cont.appendChild(headingCont);

			// create email and breakline
			var email = document.createElement("span");
			email.classList.add("pendingFriendRequestEmail");
			email.innerHTML = child.val().Email;
			var br = document.createElement("br");

			// set email and breakline
			cont.appendChild(email);
			cont.appendChild(br);

			// create choices - accept / decline
			var choices = document.createElement("span");
			choices.innerHTML = document.getElementById("masterRequest").childNodes[1].outerHTML;

			// init add friend event listenr
			choices.childNodes[0].childNodes[0].addEventListener("click", acceptFriendRequest);

			// init decline friend event listener
			choices.childNodes[0].childNodes[2].addEventListener("click", declineFriendRequest);

			// append choices to container
			cont.appendChild(choices);

			// append request to menu and display
			document.getElementById("friendRequestsMenu").appendChild(cont);

  		});

		// check amount and edit spelling depening on amount
  		if (count === 1) {
  			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + count + " pending friend request";
  		}
  		else {
  			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + count + " pending friend requests";
  		}

  		// show notification icon
  		if (count === 0) {
  			document.getElementById("friendRequestNotification").style.display = "none";
  		}

  		else {
  			document.getElementById("friendRequestNotification").style.display = "block";
  		}
	});
}


// count to controll amount message
var notificationCount = 0;
// load notifications, run at start
function loadNotifications() {
	// ref for friend request notifications
	var notificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications/friend_request_notifications/");
	notificationRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			notificationCount++;
			console.log(child.val());
			console.log(child.key);

			// only create divider if there are more than one request
			if (notificationCount > 1) {
				// create divider
				var divider = document.createElement("div");
				divider.classList.add("dropdown-divider") + divider.classList.add("notificationDivider");
				document.getElementById("notificationMenu").appendChild(divider);
			}

			// create notifications
			var notificationLink = document.createElement("a");
			notificationLink.classList.add("dropdown-item") + notificationLink.classList.add("notificationLink") + notificationLink.classList.add("animated") + notificationLink.classList.add("fadeIn");
			notificationLink.id = "friendRequestNotification-" + child.key;
			notificationLink.href = "#friendRequest-" + child.key;

			// add event listner to open friend request
			notificationLink.addEventListener("click", openNotification);

			// create and set timestamp
			var time = document.createElement("span");
			time.classList.add("friendRequestNotificationTime");
			time.innerHTML = child.val().timestamp;

			// create remove button
			var remove = document.createElement("span");
			remove.classList.add("removeNotification");
			remove.innerHTML = document.getElementById("removeNotification").childNodes[0].outerHTML;
			remove.addEventListener("click", removeNotification);

			// create breakline
			var br = document.createElement("br");

			// create and set notification message
			var notificationMessage = document.createElement("span");
			notificationMessage.innerHTML = child.val().message;
			notificationMessage.classList.add("notificationMessage");

			// append in correct order
			notificationLink.appendChild(time);
			notificationLink.appendChild(remove);
			notificationLink.appendChild(br);
			notificationLink.appendChild(notificationMessage);

			// display notifications
			document.getElementById("notificationMenu").appendChild(notificationLink);
  		});

  		// remove notification placeholder
  		if (notificationCount >= 1) {
			document.getElementById("notificationPlaceholder").style.display = "none";
			document.getElementById("notificationNotification").style.display = "block";
		}

		else {
			document.getElementById("notificationNotification").style.display = "none";
		}
	});
}

function loadFriends() {
	// get friends
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {

			// create elements
			var cont = document.createElement("a");
			cont.href = "#";
			cont.id = "chat-" + child.key;
			cont.classList.add("list-group-item") + cont.classList.add("list-group-item-action") + cont.classList.add("flex-column") + cont.classList.add("align-items-start") + cont.classList.add("friendsList");
			var nameCont = document.createElement("div");
			nameCont.classList.add("d-flex") + nameCont.classList.add("w-100") + nameCont.classList.add("justify-content-between");
			var name = document.createElement("h5");
			name.classList.add("mb-1") + name.classList.add("friendName");
			name.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();
			var onlineIcon = document.createElement("small");
			onlineIcon.classList.add("online");
			onlineIcon.innerHTML = document.getElementById("masterOnlineIcon").innerHTML;

			nameCont.appendChild(name);
			nameCont.appendChild(onlineIcon);

			var email = document.createElement("p");
			email.classList.add("mb-1") + email.classList.add("friendEmail");
			email.innerHTML = child.val().Email;
			var options = document.createElement("small");
			options.classList.add("friendOptions");
			options.innerHTML = document.getElementById("masterFriendOption").innerHTML;

			cont.appendChild(nameCont);
			cont.appendChild(email);
			cont.appendChild(options);
			options.childNodes[0].addEventListener("click", openMail);
			options.childNodes[2].addEventListener("click", openChat);
			document.getElementById("friendsListCont").appendChild(cont);

			//cont.addEventListener("click", openProfile);
		});
		// set width of fixed friendlist heading
		var width = document.getElementsByClassName("friendsList")[0].offsetWidth;
		document.getElementById("friendsListHeadingCont").style.width = width + "px";
	});
}

// open friend request menu on notification click
function openNotification() {

}

function removeNotification() {
	// remove selected notification
	var notification = this.parentElement;
	notification.remove();
	notificationCount--;
	if (document.getElementsByClassName("notificationDivider")[0] != undefined) {
		document.getElementsByClassName("notificationDivider")[0].remove();
	}

	// display default message if no notifications are present and show icon
	if (notificationCount === 0) {
		document.getElementById("notificationPlaceholder").innerHTML = "No new notifications, you are good to go!";
		document.getElementById("notificationPlaceholder").style.display = "block";
		document.getElementById("notificationNotification").style.display = "none";
	}

	else {
		document.getElementById("notificationNotification").style.display = "block";
	}

	// delete notification
	var deleteNotificationRef = firebase.database().ref("accounts/" + uidKey + "/notifications/friend_request_notifications/" + this.parentElement.id.split("-")[1]);
	deleteNotificationRef.remove();

}

// toggle on / off notifications
function toggleNotifications() {

	// notification toggle button
	var notificationsOff = document.getElementById("notificationsOff");

	// set static bg color to override bootstrap dropdown-item active effect
	notificationsOff.style.backgroundColor = "white";

	// notifications
	var notifications = document.getElementsByClassName("notificationLink");
	var divider = document.getElementsByClassName("notificationDivider");

	// if notification is on
	var path = notificationsOff.childNodes[0].childNodes[0].outerHTML;
	var line = notificationsOff.childNodes[0].childNodes[1];
	var notification = document.getElementById("notification");
	if (notification.classList.contains("feather-bell")) {
		if (notificationStatus === "off" || notificationStatus === true) {
			notificationsOff.classList.remove("feather-bell-off");
			notificationsOff.classList.add("feather-bell");
			notificationsOff.childNodes[0].childNodes[0].outerHTML = notification.childNodes[0].outerHTML;
			notificationsOff.childNodes[2].innerHTML = "Turn on notifications";

			notification.classList.remove("feather-bell");
			notification.classList.add("feather-bell-off");
			notification.childNodes[0].outerHTML = path;
			notification.appendChild(line);
			feather.replace();

			// hide notifications
			for (var i = 0; i < notifications.length; i++) {
				notifications[i].style.display = "none";
			}

			for (var i = 0; i < divider.length; i++) {
				divider[i].style.display = "none";
			}

			notificationRef.update({
				Notification_Status: "off"
			});

			// turn off notification notification
			document.getElementById("notificationNotification").style.display = "none";
		}
	}

	// if notification is off
	else {
		if (notificationStatus === "on" || notificationStatus === true) {
			notificationsOff.classList.remove("feather-bell");
			notificationsOff.classList.add("feather-bell-off");
			notificationsOff.childNodes[0].childNodes[0].outerHTML = notification.childNodes[0].outerHTML;
			var line = notification.childNodes[1];
			notificationsOff.childNodes[0].appendChild(line);
			notificationsOff.childNodes[2].innerHTML = "Turn off notifications";
			notification.classList.remove("feather-bell-off");
			notification.classList.add("feather-bell");
			notification.childNodes[0].outerHTML = path;
			feather.replace();

			// show notifications
			for (var i = 0; i < notifications.length; i++) {
				notifications[i].style.display = "block";
			}

			for (var i = 0; i < divider.length; i++) {
				divider[i].style.display = "block";
			}
	
			notificationRef.update({
				Notification_Status: "on"
			});

			if (notifications.length >= 1) {
				document.getElementById("notificationNotification").style.display = "block";
			}
		}
	}
	// controll check on load
	notificationStatus = true;
}

// toggle availability mode / online status
function availabilityMode() {

	// check if funcion is loaded or clicked on event
	if (loadSocial === true) {
		socialRef.once("value", function(snapshot) {
			availabilityModeStatus = snapshot.val().Mode;
		});
	}

	// mode toggle button
	var public = document.getElementById("onlineStatusIcon");
	var ghost = document.getElementById("onlineStatusIcon2");
	var toogleBtnCont = public.parentElement;

	// set mode to ghost if public and event is clicked
	if (availabilityModeStatus === "publicmode") {
		public.style.display = "block";
		ghost.style.display = "none";
		toogleBtnCont.removeAttribute("data-original-title");
		toogleBtnCont.setAttribute("data-original-title", "Publicmode");

		if (loadSocial === true) {
			public.style.display = "none";
			toogleBtnCont.removeAttribute("data-original-title");
			toogleBtnCont.setAttribute("data-original-title", "Ghostmode");
			ghost.style.display = "block";
			socialRef.set({
				Mode: "ghostmode"
			});
		}
	}

	// set mode to public if ghost and event is clicked
	else {
		if (availabilityModeStatus === "ghostmode") {
			ghost.style.display = "block";
			public.style.display = "none";
			toogleBtnCont.removeAttribute("data-original-title");
			toogleBtnCont.setAttribute("data-original-title", "Ghostmode");

			if (loadSocial === true) {
				ghost.style.display = "none";
				public.style.display = "block";
				toogleBtnCont.removeAttribute("data-original-title");
				toogleBtnCont.setAttribute("data-original-title", "Publicmode");
				socialRef.set({
					Mode: "publicmode"
				});
			}
		}
	}
	loadSocial = true;
	availabilityModeCheck = false;
}

// open a chat with selected user
var accTime;
var profTime;
var chatListenRef;
var profileListenKey;
var listenChat = false;
var themeColor;
var lastMessageReceivedAcc;
var lastMessageReceivedProf;
var modalChatKey;
function openChat() {
	// clear and display chat
	clear();
	document.getElementById("chatMain").innerHTML = "";
	document.getElementById("socialiconCont").style.display = "none";
	document.getElementById("chatCont").style.display = "block";
	document.getElementById("socialTrigger").click();

	// variables for name and time
	var nameAccount;
	var nameProfile;
	var timestamp;

	accountRef.once("value", function(snapshot) {
		nameAccount = snapshot.val().First_Name.capitalizeFirstLetter();
	});

	var key = this.parentElement.parentElement.id.split("-")[1];
	profileListenKey = key;

	// if opened via modal
	if (this.id === "modalChat") {
		// set key and close modal
		key = modalChatKey;
		profileListenKey = modalChatKey;
		$('#profileModal').modal('hide');
	}

	var chatRef = firebase.database().ref("accounts/" + key);
	chatRef.once("value", function(snapshot) {
		nameProfile = snapshot.val().First_Name.capitalizeFirstLetter();
		// set data about user in chat
		document.getElementById("chattingWith").innerHTML = "Now chatting with " + snapshot.val().First_Name.capitalizeFirstLetter();
		document.getElementById("chatAvatar").src = snapshot.val().Avatar_url;
		document.getElementById("chatHeaderName").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
	});

	// array to hold and sort messages after timestamp
	var chatMessages = [];

	// load chats
	var offset;
	var accountChatRef = firebase.database().ref("accounts/" + uidKey + "/chat/" + key);
	var profileChatRef = firebase.database().ref("accounts/" + key + "/chat/" + uidKey);
	chatListenRef = firebase.database().ref("accounts/" + key + "/chat/" + uidKey);

	// get color theme
	var colorRef = firebase.database().ref("accounts/" + uidKey + "/chat/theme");
	colorRef.once("value", function(snapshot) {
		themeColor = snapshot.val().color;

		// set color for heading
		var heading = document.getElementById("chatHeader");

		// create rgba color
		var splitColor = themeColor.split(")");
		var transparent = splitColor[0].split("(")[0] + "a(" + splitColor[0].split("(")[1] + ", 0.9)";
		heading.style.backgroundColor = transparent;

		// set border color input 
		document.getElementById("writeChatMessage").style.border = "1px solid " + themeColor;

		// set color for icons
		var options = document.getElementById("chatOptions").childNodes;
		for (var i = 0; i < options.length; i++) {
			if (options[i].tagName === "SPAN") {
				options[i].childNodes[0].style.stroke = themeColor;
			}
		}

		// set color send button
		document.getElementById("sendChatMessage").style.color = themeColor;
	});

	// get acc messages
	accountChatRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			chatMessages.push(child.val());
		});
	});

	// get profile messages
	var profAvatar;
	profileChatRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			chatMessages.push(child.val());
			var profileRef = firebase.database().ref("accounts/" + key);
			profileRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					profAvatar = snapshot.val().Avatar_url;
				}

				else {
					profAvatar = "/img/avatar.png";
				}
			});
		});

		// sort messages after timestamp and check sender
		chatMessages.sort(function(a,b){return a.timestamp - b.timestamp});
		for (var i = 0; i < chatMessages.length; i++) {
			if (chatMessages[i].uid === uidKey) {
				console.log(chatMessages[i].time);
				var div = document.createElement("div");
				div.classList.add("chatRowMessage") + div.classList.add("animated") + div.classList.add("fadeInUp");
				var time = document.createElement("span");
				time.classList.add("accountTime");
				time.innerHTML = chatMessages[i].time;

				var message = document.createElement("p");
				message.style.backgroundColor = themeColor;
				message.classList.add("accountMessage");
				message.innerHTML = chatMessages[i].message;

				div.appendChild(time);
				div.appendChild(message)
				
				document.getElementById("chatMain").appendChild(div);
			}

			else {
				var div = document.createElement("div");

				var avatar = document.createElement("img");
				avatar.classList.add("chatMessageAvatar");
				avatar.src = profAvatar;

				div.classList.add("chatRowMessage") + div.classList.add("animated") + div.classList.add("fadeInUp");
				var time = document.createElement("span");
				time.classList.add("profileTime");
				time.innerHTML = chatMessages[i].time;
				
				var message = document.createElement("p");
				message.classList.add("profileMessage");
				message.innerHTML = chatMessages[i].message;

				var span = document.createElement("span");
				span.appendChild(avatar);
				span.appendChild(message);
				div.appendChild(time);
				div.appendChild(span);
				
				document.getElementById("chatMain").appendChild(div);
			}

			// scroll to bottom
			var chatContScroll = document.getElementById("mainChatCont");
			chatContScroll.scrollTop = chatContScroll.scrollHeight;
		}

		// listen for changes
		startListening();
	});

	// init send message
	document.getElementById("sendChatMessage").addEventListener("click", sendChatMessage);

	// send message
	function sendChatMessage() {
		// do check
		var chatMessage = document.getElementById("writeChatMessage");
		if (chatMessage.value === "") {
			return;
		}

		// get timestamp
		var now = new Date(); 
		var hour = now.getHours();
	 	var minute = now.getMinutes();

		// add zeros if needed 
		if (hour.toString().length == 1) {
			var hour = '0' + hour;
		}

		if (minute.toString().length == 1) {
			var minute = '0' + minute;
		}

		timestamp = hour + ' ' + minute; 

		// save message
		var sendMessageRef = firebase.database().ref("accounts/" + uidKey + "/chat/" + key + "/" + new Date().getTime());
		sendMessageRef.update({
			name: nameAccount,
			message: chatMessage.value,
			time: timestamp,
			timestamp: firebase.database.ServerValue.TIMESTAMP,
			uid: uidKey
		});

		// create and render message in realtime
		var div = document.createElement("div");
		div.classList.add("chatRowMessage") + div.classList.add("animated") + div.classList.add("fadeInUp");
		var time = document.createElement("span");
		time.classList.add("accountTime");
		time.innerHTML = timestamp;
		var message = document.createElement("p");
		message.style.backgroundColor = themeColor;
		message.classList.add("accountMessage");
		message.innerHTML = chatMessage.value;

		// append
		div.appendChild(time);
		div.appendChild(message)
				
		document.getElementById("chatMain").appendChild(div);

		// reset message input
		chatMessage.value = "";
		// scroll to bottom
		var chatContScroll = document.getElementById("mainChatCont");
		chatContScroll.scrollTop = chatContScroll.scrollHeight;

		// play sound
		var audio = new Audio("/audio/send.mp3");
		audio.play();
	}

	// init change theme
	document.getElementById("colorTheme").addEventListener("click", changeTheme);
}

// listen for changes in chat, update in realtime
var lastMessageTime;
function startListening() {
	var key = profileListenKey;

	var first = true;
	var chatListenRef = firebase.database().ref("accounts/" + key + "/chat/" + uidKey);
	chatListenRef.limitToLast(1).on("child_added", function(snapshot) {
	   if (first) {
	       first = false; 
	   } 

	   else {
	       	var div = document.createElement("div");
			div.classList.add("chatRowMessage") + div.classList.add("animated") + div.classList.add("fadeInUp");
			var avatar = document.createElement("img");
			avatar.classList.add("chatMessageAvatar");
			profRef = firebase.database().ref("accounts/" + key);
			profRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					avatar.src = snapshot.val().Avatar_url;
				}
		
				else {
					avatar.src = "/img/avatar.png";
				}
			});

			var time = document.createElement("span");
			time.classList.add("profileTime");
			time.innerHTML = snapshot.val().time;	

			var message = document.createElement("p");
			message.classList.add("profileMessage");
			message.innerHTML = snapshot.val().message;

			var span = document.createElement("span");
			span.appendChild(avatar);
			span.appendChild(message);
			div.appendChild(time);
			div.appendChild(span);
						
			document.getElementById("chatMain").appendChild(div);

			// scroll to bottom
			var chatContScroll = document.getElementById("mainChatCont");
			chatContScroll.scrollTop = chatContScroll.scrollHeight;

			// play sound
			var audio = new Audio("/audio/received.mp3");
			audio.play();
	   }
	});
}

function changeTheme() {
	// open theme modal
	$('#themeModal').modal('show');

	// reset
	document.getElementById("colorDiv").innerHTML = "";

	// array with materialize colors
	var colors = {
	  "red": {
	    "50": "#ffebee",
	    "100": "#ffcdd2",
	    "200": "#ef9a9a",
	    "300": "#e57373",
	    "400": "#ef5350",
	    "500": "#f44336",
	    "600": "#e53935",
	    "700": "#d32f2f",
	    "800": "#c62828",
	    "900": "#b71c1c",
	    "a100": "#ff8a80",
	    "a200": "#ff5252",
	    "a400": "#ff1744",
	    "a700": "#d50000"
	  },
	  "pink": {
	    "50": "#fce4ec",
	    "100": "#f8bbd0",
	    "200": "#f48fb1",
	    "300": "#f06292",
	    "400": "#ec407a",
	    "500": "#e91e63",
	    "600": "#d81b60",
	    "700": "#c2185b",
	    "800": "#ad1457",
	    "900": "#880e4f",
	    "a100": "#ff80ab",
	    "a200": "#ff4081",
	    "a400": "#f50057",
	    "a700": "#c51162"
	  },
	  "purple": {
	    "50": "#f3e5f5",
	    "100": "#e1bee7",
	    "200": "#ce93d8",
	    "300": "#ba68c8",
	    "400": "#ab47bc",
	    "500": "#9c27b0",
	    "600": "#8e24aa",
	    "700": "#7b1fa2",
	    "800": "#6a1b9a",
	    "900": "#4a148c",
	    "a100": "#ea80fc",
	    "a200": "#e040fb",
	    "a400": "#d500f9",
	    "a700": "#aa00ff"
	  },
	  "deeppurple": {
	    "50": "#ede7f6",
	    "100": "#d1c4e9",
	    "200": "#b39ddb",
	    "300": "#9575cd",
	    "400": "#7e57c2",
	    "500": "#673ab7",
	    "600": "#5e35b1",
	    "700": "#512da8",
	    "800": "#4527a0",
	    "900": "#311b92",
	    "a100": "#b388ff",
	    "a200": "#7c4dff",
	    "a400": "#651fff",
	    "a700": "#6200ea"
	  },
	  "indigo": {
	    "50": "#e8eaf6",
	    "100": "#c5cae9",
	    "200": "#9fa8da",
	    "300": "#7986cb",
	    "400": "#5c6bc0",
	    "500": "#3f51b5",
	    "600": "#3949ab",
	    "700": "#303f9f",
	    "800": "#283593",
	    "900": "#1a237e",
	    "a100": "#8c9eff",
	    "a200": "#536dfe",
	    "a400": "#3d5afe",
	    "a700": "#304ffe"
	  },
	  "blue": {
	    "50": "#e3f2fd",
	    "100": "#bbdefb",
	    "200": "#90caf9",
	    "300": "#64b5f6",
	    "400": "#42a5f5",
	    "500": "#2196f3",
	    "600": "#1e88e5",
	    "700": "#1976d2",
	    "800": "#1565c0",
	    "900": "#0d47a1",
	    "a100": "#82b1ff",
	    "a200": "#448aff",
	    "a400": "#2979ff",
	    "a700": "#2962ff"
	  },
	  "lightblue": {
	    "50": "#e1f5fe",
	    "100": "#b3e5fc",
	    "200": "#81d4fa",
	    "300": "#4fc3f7",
	    "400": "#29b6f6",
	    "500": "#03a9f4",
	    "600": "#039be5",
	    "700": "#0288d1",
	    "800": "#0277bd",
	    "900": "#01579b",
	    "a100": "#80d8ff",
	    "a200": "#40c4ff",
	    "a400": "#00b0ff",
	    "a700": "#0091ea"
	  },
	  "cyan": {
	    "50": "#e0f7fa",
	    "100": "#b2ebf2",
	    "200": "#80deea",
	    "300": "#4dd0e1",
	    "400": "#26c6da",
	    "500": "#00bcd4",
	    "600": "#00acc1",
	    "700": "#0097a7",
	    "800": "#00838f",
	    "900": "#006064",
	    "a100": "#84ffff",
	    "a200": "#18ffff",
	    "a400": "#00e5ff",
	    "a700": "#00b8d4"
	  },
	  "teal": {
	    "50": "#e0f2f1",
	    "100": "#b2dfdb",
	    "200": "#80cbc4",
	    "300": "#4db6ac",
	    "400": "#26a69a",
	    "500": "#009688",
	    "600": "#00897b",
	    "700": "#00796b",
	    "800": "#00695c",
	    "900": "#004d40",
	    "a100": "#a7ffeb",
	    "a200": "#64ffda",
	    "a400": "#1de9b6",
	    "a700": "#00bfa5"
	  },
	  "green": {
	    "50": "#e8f5e9",
	    "100": "#c8e6c9",
	    "200": "#a5d6a7",
	    "300": "#81c784",
	    "400": "#66bb6a",
	    "500": "#4caf50",
	    "600": "#43a047",
	    "700": "#388e3c",
	    "800": "#2e7d32",
	    "900": "#1b5e20",
	    "a100": "#b9f6ca",
	    "a200": "#69f0ae",
	    "a400": "#00e676",
	    "a700": "#00c853"
	  },
	  "lightgreen": {
	    "50": "#f1f8e9",
	    "100": "#dcedc8",
	    "200": "#c5e1a5",
	    "300": "#aed581",
	    "400": "#9ccc65",
	    "500": "#8bc34a",
	    "600": "#7cb342",
	    "700": "#689f38",
	    "800": "#558b2f",
	    "900": "#33691e",
	    "a100": "#ccff90",
	    "a200": "#b2ff59",
	    "a400": "#76ff03",
	    "a700": "#64dd17"
	  },
	  "lime": {
	    "50": "#f9fbe7",
	    "100": "#f0f4c3",
	    "200": "#e6ee9c",
	    "300": "#dce775",
	    "400": "#d4e157",
	    "500": "#cddc39",
	    "600": "#c0ca33",
	    "700": "#afb42b",
	    "800": "#9e9d24",
	    "900": "#827717",
	    "a100": "#f4ff81",
	    "a200": "#eeff41",
	    "a400": "#c6ff00",
	    "a700": "#aeea00"
	  },
	  "yellow": {
	    "50": "#fffde7",
	    "100": "#fff9c4",
	    "200": "#fff59d",
	    "300": "#fff176",
	    "400": "#ffee58",
	    "500": "#ffeb3b",
	    "600": "#fdd835",
	    "700": "#fbc02d",
	    "800": "#f9a825",
	    "900": "#f57f17",
	    "a100": "#ffff8d",
	    "a200": "#ffff00",
	    "a400": "#ffea00",
	    "a700": "#ffd600"
	  },
	  "amber": {
	    "50": "#fff8e1",
	    "100": "#ffecb3",
	    "200": "#ffe082",
	    "300": "#ffd54f",
	    "400": "#ffca28",
	    "500": "#ffc107",
	    "600": "#ffb300",
	    "700": "#ffa000",
	    "800": "#ff8f00",
	    "900": "#ff6f00",
	    "a100": "#ffe57f",
	    "a200": "#ffd740",
	    "a400": "#ffc400",
	    "a700": "#ffab00"
	  },
	  "orange": {
	    "50": "#fff3e0",
	    "100": "#ffe0b2",
	    "200": "#ffcc80",
	    "300": "#ffb74d",
	    "400": "#ffa726",
	    "500": "#ff9800",
	    "600": "#fb8c00",
	    "700": "#f57c00",
	    "800": "#ef6c00",
	    "900": "#e65100",
	    "a100": "#ffd180",
	    "a200": "#ffab40",
	    "a400": "#ff9100",
	    "a700": "#ff6d00"
	  },
	  "deeporange": {
	    "50": "#fbe9e7",
	    "100": "#ffccbc",
	    "200": "#ffab91",
	    "300": "#ff8a65",
	    "400": "#ff7043",
	    "500": "#ff5722",
	    "600": "#f4511e",
	    "700": "#e64a19",
	    "800": "#d84315",
	    "900": "#bf360c",
	    "a100": "#ff9e80",
	    "a200": "#ff6e40",
	    "a400": "#ff3d00",
	    "a700": "#dd2c00"
	  },
	  "brown": {
	    "50": "#efebe9",
	    "100": "#d7ccc8",
	    "200": "#bcaaa4",
	    "300": "#a1887f",
	    "400": "#8d6e63",
	    "500": "#795548",
	    "600": "#6d4c41",
	    "700": "#5d4037",
	    "800": "#4e342e",
	    "900": "#3e2723"
	  },
	  "grey": {
	    "50": "#fafafa",
	    "100": "#f5f5f5",
	    "200": "#eeeeee",
	    "300": "#e0e0e0",
	    "400": "#bdbdbd",
	    "500": "#9e9e9e",
	    "600": "#757575",
	    "700": "#616161",
	    "800": "#424242",
	    "900": "#212121"
	  },
	  "bluegrey": {
	    "50": "#eceff1",
	    "100": "#cfd8dc",
	    "200": "#b0bec5",
	    "300": "#90a4ae",
	    "400": "#78909c",
	    "500": "#607d8b",
	    "600": "#546e7a",
	    "700": "#455a64",
	    "800": "#37474f",
	    "900": "#263238"
	  }
	}
	
	// get all colors, create containers for them, and init event
	for (var key in colors) {
		if (colors.hasOwnProperty(key)) {
	        var value = colors[key];
	        for (var key in value) {
	        	var div = document.createElement("div");
			    div.classList.add("col-8") + div.classList.add("themeColors");
			    div.style.backgroundColor = value[key];

			    // init select color theme 
			    div.addEventListener("click", setTheme);
			    document.getElementById("colorDiv").appendChild(div);
	        }
	    }
	}
}

function setTheme() {
	// get selected color
	var color = this.style.backgroundColor;
	themeColor = this.style.backgroundColor;

	var colorRef = firebase.database().ref("accounts/" + uidKey + "/chat/theme");
	colorRef.update({
		color: color
	});

	// set color for heading
	var heading = document.getElementById("chatHeader");

	// create rgba color
	var splitColor = color.split(")");
	var transparent = splitColor[0].split("(")[0] + "a(" + splitColor[0].split("(")[1] + ", 0.9)";
	heading.style.backgroundColor = transparent;

	// set color for every message
	var messages = document.getElementsByClassName("accountMessage");
	for (var i = 0; i < messages.length; i++) {
		messages[i].style.backgroundColor = color;
	}

	// set border color input 
	document.getElementById("writeChatMessage").style.border = "1px solid " + color;

	// set color for icons
	var options = document.getElementById("chatOptions").childNodes;
	for (var i = 0; i < options.length; i++) {
		if (options[i].tagName === "SPAN") {
			options[i].childNodes[0].style.stroke = color;
		}
	}

	// set color send button
	document.getElementById("sendChatMessage").style.color = color;

	// close modal and show your AWESOME colors
	$('#themeModal').modal('hide');
}

// open mail editor for seleted user
var emailKey;
function openMail() {
	// get key
	if (this.parentElement.parentElement.id.split("-")[0] === "chat") {
		key = this.parentElement.parentElement.id.split("-")[1];
	}

	else {
		var key = emailKey;
	}

	var emailRef = firebase.database().ref("accounts/" + key);
	emailRef.once("value", function(snapshot) {
		nameProfile = snapshot.val().First_Name.capitalizeFirstLetter();

		// set data about user in email modal
		document.getElementById("emailAvatar").src = snapshot.val().Avatar_url;
		document.getElementById("sendEmailName").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		document.getElementById("sendEmailAddress").value = snapshot.val().Email;
		document.getElementById("sendEmailContent").placeholder = "Tell " + snapshot.val().First_Name.capitalizeFirstLetter() + " whats on your mind...";

		// get sender address
		accountRef.once("value", function(snapshot) {
			// format for nodemailer
			document.getElementById("fromEmailAddress").value = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() + " - " + snapshot.val().Email + " <" +  snapshot.val().Email + ">";
			console.log(document.getElementById("fromEmailAddress").value);

			// init send mail event after data is loaded
			document.getElementById("sendEmailBtn").addEventListener("click", sendEmail);
		});
	});

	// show email modal and hide profile
	$('#profileModal').modal('hide');
	$('#emailModal').modal('show');
}

// send email
function sendEmail() {
	// check
	if (document.getElementById("emailSubject").value === "") {
		// display error message
		snackbar.innerHTML = "Please include a subject!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
		return;
	}

	if (document.getElementById("sendEmailContent").value === "") {
		// display error message
		snackbar.innerHTML = "Please include a message";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
		return;
	}

	// display message
	snackbar.innerHTML = "Mail succesfully sent to " + document.getElementById("sendEmailName").innerHTML;
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// not in use for the moment
function positionSearchbar() {}

// hide / show searchbar for friendslist
function showSearchbarFriends() {
	var searchbar = document.getElementById("filterFriends");
	this.style.pointerEvents = "none";
	setTimeout(function() {
		document.getElementById("toggleSearch").style.pointerEvents = "auto";
	},  1000);

	if (searchbar.style.display === "block") {
		document.getElementById("friendsListCont").style.paddingTop = "80px";
		searchbar.classList.remove("slideOutUp");
		searchbar.classList.add("slideOutUp");
		setTimeout(function() {
			searchbar.classList.remove("slideOutUp");
			searchbar.style.display = "none";
		},  1000);
	}

	else {
		document.getElementById("friendsListCont").style.paddingTop = "120px";
		searchbar.classList.add("slideInDown");
		searchbar.style.display = "block";
		setTimeout(function() {
			searchbar.classList.remove("slideInDown");
		},  1000);
	}
}

// filter out friends
function filterFriends() {
	var filter = this.value.toLowerCase();
	var names = document.getElementsByClassName("friendName");
	for (var i = 0; i < names.length; i++) {
		names[i].parentElement.parentElement.classList.add("animated") + names[i].parentElement.parentElement.classList.add("fadeIn");
		if (names[i].innerHTML.toLowerCase().indexOf(filter) > -1) {
			names[i].parentElement.parentElement.style.display = "block";
		}

		else {
			names[i].parentElement.parentElement.style.display = "none";
		}
	}
}

// add friend
function addFriend() {

	// hide default container
	document.getElementById("socialiconCont").style.display = "none";
	document.getElementById("chatCont").style.display = "none";

	// show add friend container
	document.getElementById("addFriendCont").style.display = "block";

	// intitialize search
	document.getElementById("searchNewFriend").addEventListener("click", findFriend);
}

// search through accounts and find matching result
function findFriend() {
	var search = document.getElementById("addFriendSearch");
	if (search.value === "" || search.value === " ") {
		document.getElementById("searchNewFriendError").classList.add("bounceIn");
		document.getElementById("searchNewFriendError").innerHTML = "Search cant be empty! Please enter a valid email address or full name."
		document.getElementById("searchNewFriendError").style.display = "block";
		setTimeout(function() {
			document.getElementById("searchNewFriendError").classList.remove("bounceIn");
		}, 1000);
		return;
	}

	// variables used to check if no matches were found before displaying error message
	var keys = [];
	var arr = [];
	var blockedUsers = [];
	var notBlocked = 0;
	var notFoundCount = 0;
	var foundCount = 0;

	// find blocked users
	blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked");
  	blockedRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			blockedUsers.push(child.key);
	  	});
	});

	// get all users
	allAccountsRef = firebase.database().ref("accounts/");
	allAccountsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			arr.push(child.val());
			keys.push(child.key);
  		});

  		// reset before displaying results
		document.getElementById("searchResults").innerHTML = "";

		// loop through accounts
  		for (var i = 0; i < arr.length; i++) {
  			// exclude signed in user from search
			if (keys[i] != uidKey) {
				notBlocked++;
				// check for matches
				console.log(arr[i]);
				if (search.value.toLowerCase() === arr[i].Email || arr[i].First_Name.toLowerCase() + " " + arr[i].Last_Name.toLowerCase() === search.value.toLowerCase()) {
					foundCount++;

					// add scrollbar to container if needed
					document.getElementById("socialMain").style.overflowY = "scroll";

					// create elements
					var cont = document.createElement("div");
					cont.id = keys[i];
					cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("text-center") + cont.classList.add("animated");
					var name = document.createElement("h5");
					name.innerHTML = arr[i].First_Name.capitalizeFirstLetter() + " " + arr[i].Last_Name.capitalizeFirstLetter();
					var email = document.createElement("p");
					email.innerHTML = arr[i].Email.toLowerCase();
					var avatar = document.createElement("img");
					avatar.classList.add("searchResultsAvatar");
					avatar.src = arr[i].Avatar_url;
					avatar.id = "profile-" + keys[i];
					var bio = document.createElement("p");
					bio.classList.add("bio");
					var icons = document.createElement("span");
					icons.classList.add("searchResultsIcons");
					icons.innerHTML = document.getElementById("masterResult").childNodes[1].innerHTML;

					// init send mail event
					icons.childNodes[2].addEventListener("click", openMail);

					// append
					cont.appendChild(name);
					cont.appendChild(email);
					cont.appendChild(avatar);
					cont.appendChild(icons);

					// init open profile event
					avatar.addEventListener("click", openProfile);

					// check if user got a bio set
					if (arr[i].Bio != undefined) {
						bio.innerHTML = arr[i].Bio;
						cont.appendChild(bio);
					}

					// if not set default text
					else {
						bio.innerHTML = "This user has not set a bio";
						cont.appendChild(bio);
					}

					// check if profile have blocked users, remove if cont id matches
					var profileBlockedUsersRef = firebase.database().ref("accounts/" + avatar.id.split("-")[1] + "/blocked");
					profileBlockedUsersRef.once("value", function(snapshot) {
						if (snapshot.val() != null || snapshot.val() != undefined) {
							cont.remove();
							// subtract from count
							foundCount--;
						}

						// show success message
						document.getElementById("searchNewFriendError").style.display = "none";
						document.getElementById("searchNewFriendSuccess").style.display = "block";
						document.getElementById("searchNewFriendSuccess").innerHTML = "We succesfully found <strong>" + foundCount + "</strong> accounts connected to your search!"; 
					});

					// display results
					cont.classList.add("fadeInUp");
					document.getElementById("searchResults").appendChild(cont);

					// scroll animation to results
					$('#socialMain').animate({
					    scrollTop: $("#searchResults").offset().top,
					}, 1500);
				}

				// if no matches were found, display error message
				else {
					notFoundCount++;
					if (notFoundCount === arr.length - 1) {
						// show error message
						document.getElementById("searchNewFriendSuccess").style.display = "none";
						document.getElementById("searchNewFriendError").classList.add("bounceIn");
						document.getElementById("searchNewFriendError").innerHTML = "We could not find any registered account connected to <strong>" + search.value.toUpperCase() + "</strong>.";
						document.getElementById("searchNewFriendError").style.display = "block";
						setTimeout(function() {
							document.getElementById("searchNewFriendError").classList.remove("bounceIn");
						}, 1000);
						return;
					}
				}
			}
  		}

  		// init friend request trigger
		var sendFriendRequestTrigger = document.getElementsByClassName("sendFriendRequest");
		for (var i = 0; i < sendFriendRequestTrigger.length; i++) {
			sendFriendRequestTrigger[i].addEventListener("click", sendFriendRequest);
		}
	});
}

function sendFriendRequest() {
	console.log(123);
	// show snackbar to confirm friend request has been sendt / if a request allready is pening
	var snackbar = document.getElementById("snackbar")
	var name = this.parentElement.parentElement.childNodes[0].innerHTML;
	var id = this.parentElement.parentElement.id;

	// check if user is allready friend
	var friendRef = firebase.database().ref("accounts/" + id + "/friends/" + uidKey);
	friendRef.once("value", function(snapshot) {
		// check if ref is present
		if (snapshot.val() != null) {
			snackbar.innerHTML = "You are allready friend with " + name.split(" ")[0];
    		snackbar.className = "show";
    		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
    		return;
		}

		// get user ref for request to be sendt, and who request were sendt from
		var friendRequestRef = firebase.database().ref("accounts/" + id + "/friend_requests/" + uidKey);
		friendRequestRef.once("value", function(snapshot) {
			// if a request is allready sendt
			if (snapshot.val() != null) {
				snackbar.innerHTML = "You allready sendt a friend request to " + name.split(" ")[0];
	    		snackbar.className = "show";
	    		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
	    		return;
			}

			else {

				// variables to hold detail
				var firstName;
				var lastName;
				var email;

				// get timestamp
				var now = new Date(); 
			    var month = now.getMonth()+1; 
			    var day = now.getDate();
			    var hour = now.getHours();
			    var minute = now.getMinutes();

			    // add zeros if needed
			    if (month.toString().length == 1) {
			        var month = '0' + month;
			    }
			    if (day.toString().length == 1) {
			        var day = '0' + day;
			    }   
			    if (hour.toString().length == 1) {
			        var hour = '0' + hour;
			    }
			    if (minute.toString().length == 1) {
			        var minute = '0' + minute;
			    }

			    var dateTime = day + '.' + month + ' ' + hour + ':' + minute;  

				// get info to fill request, send
				accountRef = firebase.database().ref("accounts/" + uidKey);
				accountRef.once("value", function(snapshot) {
					firstName = snapshot.val().First_Name;
					lastName = snapshot.val().Last_Name;
					email = snapshot.val().Email;
					friendRequestRef.update({
						First_Name: firstName,
						Last_Name: lastName,
						Email: email
					});

					// send request and store it
					var notificationRef = firebase.database().ref("accounts/" + id + "/notifications/friend_request_notifications/" + uidKey);
					notificationRef.update({
						timestamp: dateTime,
						message: firstName.capitalizeFirstLetter() + " " + lastName.capitalizeFirstLetter() + " has sendt you a friend request!" 
					});
				});

				// display message
				snackbar.innerHTML = "A friend request has been sendt to " + name.split(" ")[0];
			    snackbar.className = "show";
			    setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
			}
		});
	});
}

// accept friend request
var profileRequestKey;
function acceptFriendRequest() {
	// get user key
	var userKey;
	var friendCont;
	if (this.classList.contains("acceptFriendRequest")) {
		userKey = this.parentElement.parentElement.parentElement.id.split("-")[1];
		friendCont = this.parentElement.parentElement.parentElement;
	}

	else if (this.classList.contains("acceptFriendRequestProfile")) {
		userKey = profileRequestKey;
		friendCont = document.getElementById("friendRequestCont-" + userKey);
	}

	var friendRef = firebase.database().ref("accounts/" + uidKey + "/friends/" + userKey);
	var acceptedFriendRef = firebase.database().ref("accounts/" + userKey + "/friends/" + uidKey);
	
	// get friend data
	accountRef = firebase.database().ref("accounts/" + userKey);
	accountRef.once("value", function(snapshot) {
		var firstName = snapshot.val().First_Name;
		var lastName = snapshot.val().Last_Name;
		var email = snapshot.val().Email;

		// friend added
		friendRef.update({
			First_Name: firstName,
			Last_Name: lastName,
			Email: email
		});

		// create friend element and display it in friends list
		var cont = document.createElement("a");
		cont.href = "#";
		cont.classList.add("list-group-item") + cont.classList.add("list-group-item-action") + cont.classList.add("flex-column") + cont.classList.add("align-items-start") + cont.classList.add("friendsList") + cont.classList.add("animated") + cont.classList.add("fadeIn");
		var nameCont = document.createElement("div");
		nameCont.classList.add("d-flex") + nameCont.classList.add("w-100") + nameCont.classList.add("justify-content-between");
		var name = document.createElement("h5");
		name.classList.add("mb-1") + name.classList.add("friendName");
		name.innerHTML = firstName.capitalizeFirstLetter() + " " + lastName.capitalizeFirstLetter();
		var onlineIcon = document.createElement("small");
		onlineIcon.classList.add("online");
		onlineIcon.innerHTML = document.getElementById("masterOnlineIcon").innerHTML;

		nameCont.appendChild(name);
		nameCont.appendChild(onlineIcon);

		var friendEmail = document.createElement("p");
		friendEmail.classList.add("mb-1") + friendEmail.classList.add("friendEmail");
		friendEmail.innerHTML = email;
		var options = document.createElement("small");
		options.classList.add("friendOptions");
		options.innerHTML = document.getElementById("masterFriendOption").innerHTML;

		cont.appendChild(nameCont);
		cont.appendChild(friendEmail);
		cont.appendChild(options);
		document.getElementById("friendsListCont").appendChild(cont);

		// create friend element and display in profile page
		var cont = document.createElement("div");
		cont.id = "profile-" + snapshot.key;
		cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + snapshot.key);

		// create avatar img
		var friendImg = document.createElement("img");
		friendImg.classList.add("friendsAvatar");

		// set img src to be avatar url
		friendRef = firebase.database().ref("accounts/" + snapshot.key);
		friendRef.once("value", function(snapshot) {
			if (snapshot.val().Avatar_url != undefined) {
				friendImg.src = snapshot.val().Avatar_url;
			}
	
			else {
				friendImg.src = "/img/avatar.png";
			}
		});

		// create friend name
		var friendName = document.createElement("h5");
		friendName.classList.add("friendsName");
		friendName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();

		// create friend email
		var friendEmail = document.createElement("p");
		friendEmail.classList.add("friendsEmail");
		friendEmail.innerHTML = snapshot.val().Email;

		// append
		cont.appendChild(friendImg);
		cont.appendChild(friendName);
		cont.appendChild(friendEmail);

		// add event listener to container, used to open the selected profile
		cont.addEventListener("click", openProfile);

		// display
		document.getElementById("profileFriendsRow").appendChild(cont);


		// set friend to user who requested to be friend
		var accountRef = firebase.database().ref("accounts/" + uidKey);
		accountRef.once("value", function(snapshot) {
			var firstName = snapshot.val().First_Name;
			var lastName = snapshot.val().Last_Name;
			var email = snapshot.val().Email;

			// friend added
			acceptedFriendRef.update({
				First_Name: firstName,
				Last_Name: lastName,
				Email: email
			});

			// remove friend request
			var friendRequestRef = firebase.database().ref("accounts/" + uidKey + "/friend_requests/" + userKey);
			friendRequestRef.remove();
		});

		// remove request from DOM
		friendCont.style.display = "none";

		// get current amount and update message
		var amountOfRequests = parseInt(document.getElementById("friendRequestPlaceholder").innerHTML.split(" ")[2]);
		if (amountOfRequests - 1 === 1) {
			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend request";
		}

		else {
			document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend requests";
		}

		// show notification icon
  		if (amountOfRequests - 1 === 0) {
  			document.getElementById("friendRequestNotification").style.display = "none";
  		}

  		else {
  			document.getElementById("friendRequestNotification").style.display = "block";
  		}

  		// hide add friend profile button
  		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "none";
	});
}

// decline friend request
function declineFriendRequest() {
	// hide profile
	$('#profileModal').modal('hide');
	// get user key
	var userKey;
	var friendCont;
	if (this.classList.contains("declineFriendRequest")) {
		userKey = this.parentElement.parentElement.parentElement.id.split("-")[1];
		friendCont = this.parentElement.parentElement.parentElement;
	}

	else if (this.classList.contains("declineFriendRequestProfile")) {
		userKey = profileRequestKey;
		friendCont = document.getElementById("friendRequest-" + userKey);
	}
	// remove friend request
	var friendRequestRef = firebase.database().ref("accounts/" + uidKey + "/friend_requests/" + userKey);
	friendRequestRef.remove();
	friendCont.remove();

	// get current amount and update message
	var amountOfRequests = parseInt(document.getElementById("friendRequestPlaceholder").innerHTML.split(" ")[2]);
	if (amountOfRequests - 1 === 1) {
		document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend request";
	}

	else {
		document.getElementById("friendRequestPlaceholder").innerHTML = "You have " + (amountOfRequests - 1) + " pending friend requests";
	}

	// show notification icon
 	if (amountOfRequests - 1 === 0) {
		document.getElementById("friendRequestNotification").style.display = "none";
  	}

 	else {
  		document.getElementById("friendRequestNotification").style.display = "block";
  	}

  	// hide add friend profile button
  	document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "none";
}

// sign out
function signOut() {
	document.getElementById("loadingCover").classList.add("fadeOut")
	document.getElementById("loadingCover").style.display = "block";
	document.getElementById("loadingSlogan").innerHTML = "Signing Out";
	firebase.auth().signOut().then(function() {
		document.getElementById("loadingSlogan").innerHTML = "Signed out succesfully";
		setTimeout(function() {
			window.location.replace("/");
		},  1000);
	}, function(error) {
		document.getElementById("loadingSlogan").innerHTML = error.message;
		setTimeout(function() {
			document.getElementById("loadingCover").classList.add("fadeOut");
		    document.getElementById("loadingCover").style.display = "none";
		    document.getElementById("body").classList.add("fadeIn");
		},  2000);
	});
}

/********************************* END SOCIAL ************************************/





/************************************ PROFILE *************************************/
function profile() {
	// clear dashboard container
	clear();

	// clear cont and load account friends and blocked users
	document.getElementById("profileFriendsRow").innerHTML = "";
	loadProfileFriends();
	loadBlockedUsers();

	// hide social
	document.getElementById("socialMain").style.display = "none";
	document.getElementById("socialAside").style.display = "none";

	// show profile
	document.getElementById("mainProfile").style.display = "block";
	document.getElementById("profileCont").style.display = "block"

	// new password btn
	document.getElementById("changeProfilePassword").addEventListener("click", updatePassword);

	// init update profile events
	var inputs = document.getElementsByClassName("settingsInput");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].addEventListener("keyup", updateProfile);
	}

	// init project events
	document.getElementById("newProjectIcon").addEventListener("click", newProject);

	// init social media events
	document.getElementById("addGithubURL").addEventListener("click", addGithubURL);
	document.getElementById("addLinkedinURL").addEventListener("click", addLinkedinURL);
	document.getElementById("addInstagramURL").addEventListener("click", addInstagramURL);
	document.getElementById("addFacebookURL").addEventListener("click", addFacebookURL);
	document.getElementById("addTwitterURL").addEventListener("click", addTwitterURL);

	// load user projects
	loadProjects();

	// load profile data
	accountRef.once("value", function(snapshot) {
		// set profile data into settings
		if (snapshot.val().Bio != undefined) {
			document.getElementById("bioTextarea").value = snapshot.val().Bio;
		}
		
		document.getElementById("firstNameProfile").value = snapshot.val().First_Name;
		document.getElementById("lastNameProfile").value = snapshot.val().Last_Name;
		document.getElementById("emailProfile").value = snapshot.val().Email;
	});

	// load social media links into setting inputs and add them to profile links
	var socialMediaRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias");
	socialMediaRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			if (child.key === "facebook") {
				document.getElementById("facebookURL").value = child.val().URL;
				document.getElementById("profileFacebook").href = "https://www." + child.val().URL;
				document.getElementById("profileFacebook").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[2].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[2].addEventListener("click", removeFacebookURL);

			}

			if (child.key === "github") {
				document.getElementById("githubURL").value = child.val().URL;
				document.getElementById("profileGithub").href = "https://www." + child.val().URL;
				document.getElementById("profileGithub").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[0].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[0].addEventListener("click", removeGithubURL);
			}

			if (child.key === "instagram") {
				document.getElementById("instagramURL").value = child.val().URL;
				document.getElementById("profileInstagram").href = "https://www." + child.val().URL;
				document.getElementById("profileInstagram").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[3].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[3].addEventListener("click", removeInstagramURL);
			}

			if (child.key === "linkedin") {
				document.getElementById("linkedinURL").value = child.val().URL;
				document.getElementById("profileLinkedin").href = "https://www." + child.val().URL;
				document.getElementById("profileLinkedin").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[1].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[1].addEventListener("click", removeLinkedinURL);
			}

			if (child.key === "twitter") {
				document.getElementById("twitterURL").value = child.val().URL;
				document.getElementById("profileTwitter").href = "https://www." + child.val().URL;
				document.getElementById("profileTwitter").style.display = "block";
				document.getElementsByClassName("removeSocialMedia")[4].style.display = "inline-block";
				document.getElementsByClassName("removeSocialMedia")[4].addEventListener("click", removeTwitterURL);
			}
		});
	});
}

// load account friends
function loadProfileFriends() {
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		console.log(snapshot.val());
		// if no friends are present, display container
		if (snapshot.val() === null || snapshot.val() === undefined) {
			document.getElementById("noFriendsRow").style.display = "block";
		}

		else {
			document.getElementById("noFriendsRow").style.display = "none";
		}
		snapshot.forEach((child) => {
			
			// create friend container
			var cont = document.createElement("div");
			cont.id = "profile-" + child.key;
			cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + child.key);

			// create avatar img
			var friendImg = document.createElement("img");
			friendImg.classList.add("friendsAvatar");

			// set img src to be avatar url
			friendRef = firebase.database().ref("accounts/" + child.key);
			friendRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					friendImg.src = snapshot.val().Avatar_url;
				}

				else {
					friendImg.src = "/img/avatar.png";
				}
			});

			// create friend name
			var friendName = document.createElement("h5");
			friendName.classList.add("friendsName");
			friendName.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

			// create friend email
			var friendEmail = document.createElement("p");
			friendEmail.classList.add("friendsEmail");
			friendEmail.innerHTML = child.val().Email;

			// append
			cont.appendChild(friendImg);
			cont.appendChild(friendName);
			cont.appendChild(friendEmail);

			// add event listener to container, used to open the selected profile
			cont.addEventListener("click", openProfile);

			// display
			document.getElementById("profileFriendsRow").appendChild(cont);
  		});
	});
}

// load all blocked user
function loadBlockedUsers() {
	var blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked");
	blockedRef.once("value", function(snapshot) {
		// check for users
		if (snapshot.val() === null || snapshot.val() === undefined) {
			document.getElementById("blockedUsersRow").style.display = "none";
		}

		else {
			document.getElementById("blockedUsersRow").style.display = "block";
		}

		// get users
		snapshot.forEach((child) => {
			var blockedUserRef = firebase.database().ref("accounts/" + child.key);
			blockedUserRef.once("value", function(snapshot) {
				var cont = document.createElement("div");
				cont.id = "blokced-" + child.key;
				cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileBlockedCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("blocked-" + child.key);

				// create avatar img
				var userImg = document.createElement("img");
				userImg.classList.add("blockedAvatar");

				// unblur pic on click
				userImg.addEventListener("click", unblurBlocked);

				// set img src to be avatar url
				userImgRef = firebase.database().ref("accounts/" + child.key);
				userImgRef.once("value", function(snapshot) {
					if (snapshot.val().Avatar_url != undefined) {
						userImg.src = snapshot.val().Avatar_url;
					}

					else {
						userImg.src = "/img/avatar.png";
					}
				});

				// create user name
				var userName = document.createElement("h5");
				userName.classList.add("blockedName");
				userName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();

				// unblock btn
				var unblockTrigger =  document.createElement("p");
				unblockTrigger.classList.add("unblockUser") + unblockTrigger.classList.add("text-center");
				unblockTrigger.innerHTML = "Unblock";
				unblockTrigger.addEventListener("click", unblock);

				// append to cont
				cont.appendChild(userImg);
				cont.appendChild(userName);
				cont.appendChild(unblockTrigger);

				// display
				document.getElementById("blockedUsersRow").appendChild(cont);
			});
		});
	});
	// init display blocked users
	document.getElementById("toggleBlockedUsers").addEventListener("click", displayBlocked);
}

// load projects connected to user
function loadProjects() {
	// clear and load
	var count = 0;
	document.getElementById("projectsCont").innerHTML = "";
	var projectRef = firebase.database().ref("accounts/" + uidKey + "/projects");
	projectRef.once("value", function(snapshot) {
		count++;
		snapshot.forEach((child) => {

			console.log(child.val());
			// create project elements
			var cont = document.createElement("div");
			cont.classList.add("col-sm-6");
			cont.id = "project-" + child.val().id;

			var card = document.createElement("div");
			card.classList.add("card");

			var cardBody = document.createElement("div");
			cardBody.classList.add("card-body");

			var title = document.createElement("h5");
			title.classList.add("card-title") + title.classList.add("projectTitle");
			title.innerHTML = child.val().name.capitalizeFirstLetter();

			var id = document.createElement("p");
			id.classList.add("projectId");
			id.innerHTML = child.val().id;

			var avatarRow = document.createElement("div");

			var btnCont = document.createElement("div");
			btnCont.classList.add("row") + btnCont.classList.add("col-sm-12") + btnCont.classList.add("gotoProject");

			var btn = document.createElement("a");
			btn.classList.add("btn") + btn.classList.add("gotoProjectBtn");
			btn.innerHTML = "Go to project";
			btn.style.color = "white";
			btn.addEventListener("click", openProject);

			// appends
			cardBody.appendChild(title);
			cardBody.appendChild(id);
			cardBody.appendChild(avatarRow);

			// images
			var members = child.val().members;
			for (var key in members) {
				var key = members[key];
				var memberRef = firebase.database().ref("accounts/" + key);
				memberRef.once("value", function(snapshot) {
					var avatar = document.createElement("img");
					avatar.id = "member-" + snapshot.key;
					avatar.classList.add("col-sm-2") + avatar.classList.add("projectAvatar");
					avatar.src = snapshot.val().Avatar_url;
					avatar.addEventListener("click", openProfile);
					avatarRow.appendChild(avatar);
				});
			}

			btnCont.appendChild(btn);
			cardBody.appendChild(btnCont);
			card.appendChild(cardBody);
			cont.appendChild(card);

			// display
			document.getElementById("projectsCont").appendChild(cont);
		});

		if (count > 0) {
			document.getElementById("noProjects").style.display = "none";
		}

		else {
			document.getElementById("noProjects").style.display = "block";
		}
	});
}

// unblocks the user
function unblock() {
	// get key and remove
	var key = this.parentElement.id.split("-")[1];
	var blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked/" + key);
	blockedRef.remove();
	this.parentElement.remove();

	// show message
	snackbar.innerHTML = "User unblocked! You can now interact with the user again.";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// toggle blocked users
var blockedCheck = false;
function displayBlocked() {
	// get profiles
	var blocked = document.getElementsByClassName("profileBlockedCont");

	// show
	if (blockedCheck === false) {
		blockedCheck = true;
		this.innerHTML = "Hide";
		for (var i = 0; i < blocked.length; i++) {
			blocked[i].style.display = "block";
		}
	}

	// hide
	else {
		blockedCheck = false;
		this.innerHTML = "Show";
		for (var i = 0; i < blocked.length; i++) {
			blocked[i].style.display = "none";
		}
	}
}

var settingsKey;
function openProfile() {
	//scroll top of div
	var modal = document.getElementById("profileModal");
	modal.scrollTop = 0;

	// get profile key
	var profileKey = this.id.split("-")[1];
	profileRequestKey = profileKey;
	modalChatKey = profileKey;
	emailKey = profileKey;

	// check if profile is from friend request
	if (this.id.split("-")[0] === "friendRequest") {
		document.getElementById("unfriendUser").style.display = "none";
		document.getElementById("unfriendDivider").style.display = "none";
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "block";

		// event listener for add friend button
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].childNodes[0].addEventListener("click", acceptFriendRequest);

		// event listener for decline friend button
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].childNodes[2].addEventListener("click", declineFriendRequest);
	}

	else {
		document.getElementById("unfriendUser").style.display = "block";
		document.getElementById("unfriendDivider").style.display = "block";
		document.getElementsByClassName("pendingFriendRequestChoicesProfile")[0].style.display = "none";
	}

	// used to controll settings
	settingsKey = profileKey;

	// remove options (unfriend, report, block) if profile is account
	if (profileKey === uidKey) {
		document.getElementById("profileModalSettings").style.display = "none";
	}

	else {
		document.getElementById("profileModalSettings").style.display = "block";
	}

	// unblur image when cancelling a setting
	document.getElementById("body").addEventListener("click", unblur);

	// profile modal elements
	var profileAvatar = document.getElementById("profileModalAvatar");
	var profileName = document.getElementById("profileModalName");
	var profileEmail = document.getElementById("profileModalEmail");
	var profileBio = document.getElementById("profileModalBio");
	var chat = document.getElementById("profileModalCommunication").childNodes[2];
	var mail = document.getElementById("profileModalCommunication").childNodes[0];
	var coverImg = document.getElementById("coverImg");

	// init open mail event
	mail.addEventListener("click", openMail);

	// set data from profile ref
	var profileRef = firebase.database().ref("accounts/" + profileKey);
	profileRef.once("value", function(snapshot) {

		// check if profile is friend with account
		var isFriendRef = firebase.database().ref("accounts/" + uidKey + "/friends/" + profileKey)
		isFriendRef.once("value", function(snapshot) {
			// remove UNFRIEND option if account is not friend with profile
			if (snapshot.val() != null || snapshot.val() != undefined) {
				document.getElementById("unfriendUser").style.display = "block";
				document.getElementById("unfriendDivider").style.display = "block";
				// init chat event for profile
				chat.style.display = "inline-block";
				chat.addEventListener("click", openChat);
			}

			else {
				document.getElementById("unfriendUser").style.display = "none";
				document.getElementById("unfriendDivider").style.display = "none";
				chat.style.display = "none";
			}
		});

		// set settings
		document.getElementById("profileModalSettingsHeading").innerHTML = "Settings for " + snapshot.val().First_Name.capitalizeFirstLetter();

		// init settings event
		document.getElementById("unfriendUser").addEventListener("click", unfriendUser);
		document.getElementById("reportUser").addEventListener("click", reportUser);
		document.getElementById("blockUser").addEventListener("click", blockUser);

		// set information
		profileAvatar.src = snapshot.val().Avatar_url;
		profileName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		profileEmail.innerHTML = snapshot.val().Email;

		// check for user bio
		if (snapshot.val().Bio != undefined) {
			profileBio.innerHTML = snapshot.val().Bio;
			profileBio.style.display = "block";
		}

		else {
			profileBio.innerHTML = "";
			profileBio.style.display = "none";
		}

		// connect with profile
		document.getElementById("connectUser").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter();

		// check for common friends
		var commonFriends = [];
		var friends = [];
		var profileFriends = [];

		// check for blocked users
		var blockedUsers = [];

		var myFriendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
		var profileFriendsRef = firebase.database().ref("accounts/" + profileKey + "/friends");
		myFriendsRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				friends.push(child.key);
			});
		});

		// find blocked users
		blockedRef = firebase.database().ref("accounts/" + uidKey + "/blocked");
	  	blockedRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				blockedUsers.push(child.key);
		  	});
		});

	  	// get profile friends
		profileFriendsRef.once("value", function(snapshot) {
			// reset friends cont before appending
			document.getElementById("profileModalFriendsRow").innerHTML = "";
			document.getElementById("commonFriends").innerHTML = "";
			snapshot.forEach((child) => {

				// push profile friends to array
				profileFriends.push(child.key);

				// create friend container
				var cont = document.createElement("div");
				cont.id = "profile-" + child.key;
				cont.classList.add("col") + cont.classList.add("col-lg-5") + cont.classList.add("profileModalFriendsCont") + cont.classList.add("animated") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + child.key);

				// create avatar img
				var friendImg = document.createElement("img");
				friendImg.classList.add("friendsAvatar");

				// set img src to be avatar url
				friendRef = firebase.database().ref("accounts/" + child.key);
				friendRef.once("value", function(snapshot) {
					if (snapshot.val().Avatar_url != undefined) {
						friendImg.src = snapshot.val().Avatar_url;
					}

					else {
						friendImg.src = "/img/avatar.png";
					}
				});

				// create friend name
				var friendName = document.createElement("h5");
				friendName.classList.add("friendsName");
				friendName.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

				// create friend email
				var friendEmail = document.createElement("p");
				friendEmail.classList.add("friendsEmail");
				friendEmail.innerHTML = child.val().Email;

				// append
				cont.appendChild(friendImg);
				cont.appendChild(friendName);
				cont.appendChild(friendEmail);

				// add event listener to container, used to open the selected profile
				cont.addEventListener("click", openProfile);

				// check if profile is logged in account
				document.getElementById("commonFriends").innerHTML = "";
				if (profileKey === uidKey) {
					document.getElementById("profileModalCommunication").style.display = "none";
					document.getElementById("commonFriends").innerHTML = "";
					document.getElementById("profileModalSettings").style.display = "none";
				}

				else {
					document.getElementById("profileModalCommunication").style.display = "block";

					// count amount of common friends
					var commonsCount = 0;
					for (var i = 0; i < friends.length; i++) {
						for (var x = 0; x < profileFriends.length; x++) {
							if (friends[i] === profileFriends[x]) {
								commonsCount++;
							}
						}
					}

					// set amount of common friends
					document.getElementById("commonFriends").innerHTML = commonsCount + " common";

					// settings available
					document.getElementById("profileModalSettings").style.display = "inline-block";
				}

				// display
				document.getElementById("profileModalFriendsRow").appendChild(cont);

				// if user is blocked, remove
				for (var i = 0; i < blockedUsers.length; i++) {
					if (cont.id.split("-")[1] === blockedUsers[i]) {
						cont.remove();
					}
				}

				// check if profile have blocked users, remove if cont id matches
				var profileBlockedUsersRef = firebase.database().ref("accounts/" + cont.id.split("-")[1] + "/blocked");
				profileBlockedUsersRef.once("value", function(snapshot) {
					if (snapshot.val() != null || snapshot.val() != undefined) {
						cont.remove();
					}
				});
			});

			// display no friend message if the user have no friends
			if (profileFriends.length === 0) {
				document.getElementById("foreverAlone").style.display = "block";
			}

			else {
				document.getElementById("foreverAlone").style.display = "none";
			}

			// resets links before appending
			var socialRow = document.getElementById("connectWithProfileRow").childNodes;
			for (var i = 0; i < socialRow.length; i++) {
				if (socialRow[i].tagName === "A") {
					socialRow[i].style.display = "none";
				}
			}

			// display social links
			var socialMediaRef = firebase.database().ref("accounts/" + profileKey + "/socialMedias");
			socialMediaRef.once("value", function(snapshot) {

				// check if profile have social media links conneted
				if (snapshot.val() === null) {
					document.getElementById("noConnections").style.display = "block";
				}

				else {
					document.getElementById("noConnections").style.display = "none";
				}

				snapshot.forEach((child) => {
					if (child.key === "facebook") {
						document.getElementById("profileFacebookModal").href = "https://www." + child.val().URL;
						document.getElementById("profileFacebookModal").style.display = "block";
					}

					if (child.key === "github") {
						document.getElementById("profileGithubModal").href = "https://www." + child.val().URL;
						document.getElementById("profileGithubModal").style.display = "block";
					}

					if (child.key === "instagram") {
						document.getElementById("profileInstagramModal").href = "https://www." + child.val().URL;
						document.getElementById("profileInstagramModal").style.display = "block";
					}

					if (child.key === "linkedin") {
						document.getElementById("profileLinkedinModal").href = "https://www." + child.val().URL;
						document.getElementById("profileLinkedinModal").style.display = "block";
					}

					if (child.key === "twitter") {
						document.getElementById("profileTwitterModal").href = "https://www." + child.val().URL;
						document.getElementById("profileTwitterModal").style.display = "block";
					}
				});
			});

			// show profile
			$('#profileModal').modal('show');
		});
	});
}


// allows user to update avatar
function uploadAvatar() {
	
	// mini and main avatar nodes
	var miniAvatar = document.getElementById("userAvatar");
	var avatar = document.getElementById("profileImg");

	// file uploaded
	var file = document.getElementById("avatarUpload").files[0];

	// upload file to db and set URL to profile
	var storageRef = firebase.storage().ref();
	var avatarRef = storageRef.child("avatars/" + uidKey);
	avatarRef.put(file).then(function(snapshot) {
	  var url = snapshot.metadata.downloadURLs[0];
	  avatar.src = url;
	  miniAvatar.src = url;
	  accountRef.update({
	  	Avatar_url: url
	  });
	});
}

// unblur avatar and reset settings options
function unblur() {
	document.getElementById("profileModalAvatar").style.filter = "none";
	cancelUnfriend();
	cancelReport();
	cancelBlock();
}

function unblurBlocked() {
	if (this.style.filter === "none") {
		this.style.filter = "blur(2px)";
	}

	else {
		this.style.filter = "none";
	}
}

// unfriend selected user
function unfriendUser() {

	// close potensial other options
	document.getElementById("cancelReport").click();
	document.getElementById("cancelBlock").click();

	// display unfriend form
	document.getElementById("confirmUnfriendCont").style.display = "block";
	document.getElementById("unfriendLabel").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// create label
	document.getElementById("unfriendLabel").innerHTML = "Are you sure you want to unfriend " + document.getElementById("profileModalName").innerHTML.split(" ")[0] + "?";

	// init cancel and confirm events
	document.getElementById("cancelUnfriend").addEventListener("click", cancelUnfriend);
	document.getElementById("confirmUnfriend").addEventListener("click", confirmUnfriend);
		
}

function cancelUnfriend() {
	// hide report form and remove blur from avatar image
	document.getElementById("confirmUnfriendCont").style.display = "none";
	document.getElementById("profileModalAvatar").style.filter = "none";
	document.getElementById("unfriendLabel").style.display = "none";
}

function confirmUnfriend() {
	// remove user from account and account from user, get refs
	var unfriendUser = firebase.database().ref("accounts/" + uidKey + "/friends/" + settingsKey);
	var unfriendAccount = firebase.database().ref("accounts/" + settingsKey + "/friends/" + uidKey);

	// remove connection from both accounts
	unfriendUser.remove();
	unfriendAccount.remove();

	// remove friend from DOM
	var friend = document.getElementsByClassName("profile-" + settingsKey);
	friend[0].remove();

	// display message
	snackbar.innerHTML = "You are no longer friends with " + document.getElementById("profileModalName").innerHTML.split(" ")[0];
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

	// hide modal
	$('#profileModal').modal('hide');
}

// report selected user
function reportUser() {

	//close potensial other options
	document.getElementById("cancelUnfriend").click();
	document.getElementById("cancelBlock").click();

	// display report form
	document.getElementById("reportReasonCont").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// set label
	document.getElementById("reportReasonLabel").innerHTML = "Are you sure you want to report " + document.getElementById("profileModalName").innerHTML.split(" ")[0] + "?";


	// init cancel and confirm events
	document.getElementById("cancelReport").addEventListener("click", cancelReport);
	document.getElementById("confirmReport").addEventListener("click", confirmReport);
}

function cancelReport() {
	// hide report form and remove blur from avatar image
	document.getElementById("reportReasonCont").style.display = "none";
	document.getElementById("profileModalAvatar").style.filter = "none";
}

function confirmReport() {
	// get reason for report
	var reason = document.getElementById("reportReason").value;

	// check if reason is selected
	if (reason === "" || reason === undefined) {
		document.getElementById("reportReason").style.borderBottom = "0.5px solid #ef5350";
		return;
	}

	else {
		document.getElementById("reportReason").style.borderBottom = "none";
	}

	// get timestamp
	var now = new Date(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + hour + ':' + minute;

	// store report with the reporter, and reason
	var reportRef = firebase.database().ref("accounts/" + settingsKey + "/reports/" + uidKey);
	reportRef.update({
		Reason: reason,
		Timestamp: dateTime
	});

	// close report
	document.getElementById("cancelReport").click();

	// display message
	snackbar.innerHTML = "Thank you for reporting this user!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// block selected user
function blockUser() {
	// close potensial other options
	document.getElementById("cancelReport").click();
	document.getElementById("cancelUnfriend").click();

	// display report form
	document.getElementById("blockCont").style.display = "block";

	// add a blur to the avatar image 
	document.getElementById("profileModalAvatar").style.filter = "blur(5px)";

	// set label
	document.getElementById("blockLabel").innerHTML = "Are you sure you want to block " + document.getElementById("profileModalName").innerHTML.split(" ")[0] + "?";

	// init cancel and confirm events
	document.getElementById("cancelBlock").addEventListener("click", cancelBlock);
	document.getElementById("confirmBlock").addEventListener("click", confirmBlock);
}

function cancelBlock() {
	// hide block form and remove blur from avatar image
	document.getElementById("blockCont").style.display = "none";
	document.getElementById("profileModalAvatar").style.filter = "none";
}

function confirmBlock() {
	// get timestamp
	var now = new Date(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + hour + ':' + minute;

	// store block
	var reportRef = firebase.database().ref("accounts/" + uidKey + "/blocked/" + settingsKey);
	reportRef.update({
		Timestamp: dateTime
	});

	// remove user from account and account from user, get refs
	var unfriendUser = firebase.database().ref("accounts/" + uidKey + "/friends/" + settingsKey);
	var unfriendAccount = firebase.database().ref("accounts/" + settingsKey + "/friends/" + uidKey);

	// remove connection from both accounts
	unfriendUser.remove();
	unfriendAccount.remove();

	// remove friend from DOM
	var friend = document.getElementsByClassName("profile-" + settingsKey);
	friend[0].remove();

	// close block
	document.getElementById("cancelBlock").click();

	// display message
	snackbar.innerHTML = "The user have now been blocked! They will no longer be able to see or interact with this you.";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

	// close modal
	$('#profileModal').modal('hide');
}

function updateProfile() {
	//cancel and confirm buttons
	var cancel = document.getElementById("cancelProfileUpdateCont");
	var update = document.getElementById("confirmProfileUpdateCont");

	// original input values
	var bio;
	var firstName;
	var lastName;
	var email;

	// get inputs and store in variables
	var inputs = document.getElementsByClassName("settingsInput");
	bio = inputs[0].value;
	firstName = inputs[1].value;
	lastName = inputs[2].value;
	email = inputs[3].value;

	var settingsRef = firebase.database().ref("accounts/" + uidKey);
	settingsRef.once("value", function(snapshot) {
		// if changes are made, add event to buttons
		if (snapshot.val().Bio != bio || snapshot.val().First_Name != firstName || snapshot.val().Last_Name != lastName || snapshot.val().Email != email) {
			cancel.style.opacity = "1";
			update.style.opacity = "1";

			// add events
			cancel.addEventListener("click", cancelProfileUpdate);
			update.addEventListener("click", confirmProfileUpdate);
		}

		else {
			cancel.style.opacity = "0.3";
			update.style.opacity = "0.3";

			// remove events
			cancel.removeEventListener("click", cancelProfileUpdate);
			update.removeEventListener("click", confirmProfileUpdate);
		}
	});

	console.log(bio);
}

function cancelProfileUpdate() {
	// reset settings
	var settingsRef = firebase.database().ref("accounts/" + uidKey);
	settingsRef.once("value", function(snapshot) {
		var inputs = document.getElementsByClassName("settingsInput");
		inputs[0].value = snapshot.val().Bio;
		inputs[1].value = snapshot.val().First_Name;
		inputs[2].value = snapshot.val().Last_Name;
		inputs[3].value = snapshot.val().Email;
		updateProfile();

		// remove event instant
		document.getElementById("cancelProfileUpdateCont").removeEventListener("click", cancelProfileUpdate);
		document.getElementById("confirmProfileUpdateCont").removeEventListener("click", confirmProfileUpdate);
	});
}

// update profile
var emailConfirmation = false;
function confirmProfileUpdate() {
	// get setting value ref
	var settingsRef = firebase.database().ref("accounts/" + uidKey);
	settingsRef.once("value", function(snapshot) {
		var inputs = document.getElementsByClassName("settingsInput");

		// bio
		if (inputs[0].value != snapshot.val().Bio && inputs[0].value.length >= 2) {
			settingsRef.update({
				Bio: inputs[0].value
			});
			snackbar.innerHTML = "Profile succesfully updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// update and reset if ok
			cancelProfileUpdate();
		}

		// first name
		if (inputs[1].value != snapshot.val().First_Name && inputs[1].value.length >= 2) {
			settingsRef.update({
				First_Name: inputs[1].value
			});
			snackbar.innerHTML = "Profile succesfully updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// update and reset if ok
			cancelProfileUpdate();
		}

		// last name
		if (inputs[2].value != snapshot.val().Last_Name && inputs[2].value.length >= 2) {
			settingsRef.update({
				Last_Name: inputs[2].value
			});
			snackbar.innerHTML = "Profile succesfully updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// update and reset
			cancelProfileUpdate();
		}

		// check for valid email
		regEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
		OK = regEx.test(inputs[3].value);
		if (!OK) {
			snackbar.innerHTML = "Please enter a valid email! " + inputs[3].value + " is not a valid email";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
			return;
		}

		// update email
		if (inputs[3].value != snapshot.val().Email && OK) {
			console.log("ok");
			// get user
			var user = firebase.auth().currentUser;
			user.updateEmail(inputs[3].value).then(function() {
				settingsRef.update({
					Email: inputs[3].value
				});
				snackbar.innerHTML = "Profile succesfully updated!";
				snackbar.className = "show";
				setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
				cancelProfileUpdate();
			  // Update successful.
			}).catch(function(error) {

				// display error and prompt re-authenticate modal
			  	$('#authenticateModalCont').modal('show');

			  	// confirms that email shall be updated if re-authenticated
			  	emailConfirmation = true;

			  	// init event for re-authentication
			  	document.getElementById("loginBtn").addEventListener("click", authenticate);
			});
		}
	});
}

// open update password modal and trigger event to change password
function updatePassword() {
	// show modal
	$('#changePasswordModalCont').modal('show');

	// init update password event
	document.getElementById("changePasswordBtn").addEventListener("click", confirmUpdatePassword);
}

var passConfirmation = false;
function confirmUpdatePassword() {
	// get values
	var password = document.getElementById("newPassword");
	var confirmPassword = document.getElementById("confirmPassword");
	// check for secure password
	regEx = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
	OK = regEx.test(password.value);

	if (!OK) {
		document.getElementById("changePasswordErrorMessage").style.display = "block";
		document.getElementById("changePasswordErrorMessage").innerHTML = "Password needs to contain the following: <strong><br>1 Uppercase letter<br>1 Lowercase letter<br>1 Number<br>8 Characters long</strong>";
		return;
	}

	if (password.value != confirmPassword.value) {
		document.getElementById("changePasswordErrorMessage").style.display = "block";
		document.getElementById("changePasswordErrorMessage").innerHTML = "Passwords dont match! Please try again";
		return;
	}
	
	// update password
	var user = firebase.auth().currentUser;
	user.updatePassword(password.value).then(function() {
	  	// Update successful.
	 	$('#changePasswordModalCont').modal('hide');
	  	snackbar.innerHTML = "Profile succesfully updated!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

		// reset form
		password.value = "";
		confirmPassword.value = "";
	}).catch(function(error) {
	  // An error happened.

	  // display re-authenticate modal and hide change password modal
	  $('#changePasswordModalCont').modal('hide');
	  $('#authenticateModalCont').modal('show');

	  // confirms that email shall be updated if re-authenticated
	  passConfirmation = true;
	});
}

// re-authenticate the user
function authenticate() {
	// get values
	var inputs = document.getElementsByClassName("settingsInput");
	var user = firebase.auth().currentUser;
	var email = document.getElementById("loginEmail").value;
	var password = document.getElementById("loginPassword").value;
	var credentials = firebase.auth.EmailAuthProvider.credential(email, password);

	// Prompt the user to re-provide their sign-in credentials
	user.reauthenticateWithCredential(credentials).then(function() {
	  	// User re-authenticated.
	  	$('#authenticateModalCont').modal('hide');

	  	// get setting value ref
		var settingsRef = firebase.database().ref("accounts/" + uidKey);
		settingsRef.once("value", function(snapshot) {

			// check for confirmation
			if (emailConfirmation === true) {
				// update email
				var updatedEmail = document.getElementById("emailProfile").value;
				user.updateEmail(updatedEmail);
				settingsRef.update({
					Email: updatedEmail
				});

				// display message
				snackbar.innerHTML = "Profile succesfully updated!";
				snackbar.className = "show";
				setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
				cancelProfileUpdate();
			}

			if (passConfirmation === true) {
				console.log(123);
				// update password
				var password = document.getElementById("confirmPassword").value;
				var user = firebase.auth().currentUser;
				user.updatePassword(password);

				// display message
				snackbar.innerHTML = "Profile succesfully updated!";
				snackbar.className = "show";
				setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
				cancelProfileUpdate();

				// reset form
				document.getElementById("newPassword").value = "";
				password = "";
			}
		});
	}).catch(function(error) {
	  // An error happened, and display message
	  document.getElementById("authenticateError").style.display = "block";
	  document.getElementById("authenticateErrorMsg").innerHTML = error.message;
	  return;
	});
}

// add github
function addGithubURL() {
	// get github ref
	var githubRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/github");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("githubURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("githubURL").value;
	if (url[0].toLowerCase() === "https://github." || url[0].toLowerCase() === "www.github." || url[0].toLowerCase() === "github.") {
		// add URL to profile
		githubRef.update({
			URL: validURL
		});

		// display message
		errorMessage[0].innerHTML = "GtHub succesfully added to your profile!";
		errorMessage[0].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[0].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[0].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[0].addEventListener("click", removeGithubURL);

		document.getElementById("profileGithub").href = "https://www." + validURL;
		document.getElementById("profileGithub").style.display = "block";
	}

	else {
		// display error message
		errorMessage[0].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[0].style.color = "#ef5350";
		return;
	}
}

// add linkedin
function addLinkedinURL() {
	// get github ref
	var linkedinRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/linkedin");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("linkedinURL").value.toLowerCase().split(".com/");
	var validURL = document.getElementById("linkedinURL").value;
	console.log(url[1].split("/"));
	if (url[1].split("/")[0].toLowerCase() === "in" || url[1].split("/")[0] === "in" && url[1].split("/")[1] != "" && url[0].split("/")[0].toLowerCase() === "linkedin") {
		console.log(url[1].split("/"));
		// add URL to profile
		linkedinRef.update({
			URL: validURL
		});

		// display message
		errorMessage[1].innerHTML = "LinkedIn succesfully added to your profile!";
		errorMessage[1].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[1].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[1].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[1].addEventListener("click", removeLinkedinURL);

		document.getElementById("profileLinkedin").href = "https://www." + validURL;
		document.getElementById("profileLinkedin").style.display = "block";
	}

	else {
		// display error message
		errorMessage[1].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[1].style.color = "#ef5350";
		return;
	}
}

// add instagram
function addInstagramURL() {
	// get instagram ref
	var instagramRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/instagram");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("instagramURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("instagramURL").value;
	console.log(url);
	if (url[0].toLowerCase() === "https://www.instagram." || url[0].toLowerCase() === "www.instagram." || url[0].toLowerCase() === "instagram.") {
		// add URL to profile
		instagramRef.update({
			URL: validURL
		});

		// display message
		errorMessage[2].innerHTML = "Instagram succesfully added to your profile!";
		errorMessage[2].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[2].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[2].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[2].addEventListener("click", removeInstagramURL);

		document.getElementById("profileInstagram").href = "https://www." + validURL;
		document.getElementById("profileInstagram").style.display = "block";
	}

	else {
		// display error message
		errorMessage[2].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[2].style.color = "#ef5350";
		return;
	}
}

// add github
function addFacebookURL() {
	// get facebookref
	var facebookRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/facebook");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("facebookURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("facebookURL").value;
	console.log(url);
	if (url[0].toLowerCase() === "https://www.facebook." || url[0].toLowerCase() === "www.facebook." || url[0].toLowerCase() === "facebook.") {
		// add URL to profile
		facebookRef.update({
			URL: validURL
		});

		// display message
		errorMessage[3].innerHTML = "Facebook succesfully added to your profile!";
		errorMessage[3].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[3].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[3].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[3].addEventListener("click", removeFacebookURL);

		document.getElementById("profileFacebook").href = "https://www." + validURL;
		document.getElementById("profileFacebook").style.display = "block";
	}

	else {
		// display error message
		errorMessage[3].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[3].style.color = "#ef5350";
		return;
	}
}

// add twitter
function addTwitterURL() {
	// get twitter ref
	var twitterRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/twitter");

	// get error element in case of error
	var errorMessage = document.getElementsByClassName("socialMediaError");

	// check for valid URL
	var url = document.getElementById("twitterURL").value.toLowerCase().split("com/");
	var validURL = document.getElementById("twitterURL").value;
	if (url[0].toLowerCase() === "https://twitter." || url[0].toLowerCase() === "www.twitter." || url[0].toLowerCase() === "twitter.") {
		// add URL to profile
		twitterRef.update({
			URL: validURL
		});

		// display message
		errorMessage[4].innerHTML = "Twitter succesfully added to your profile!";
		errorMessage[4].style.color = "#66bb6a";
		setTimeout(function() {
			errorMessage[4].innerHTML = "";
		}, 3000);

		// init delete event
		document.getElementsByClassName("removeSocialMedia")[4].style.display = "inline-block";
		document.getElementsByClassName("removeSocialMedia")[4].addEventListener("click", removeTwitterURL);

		document.getElementById("profileTwitter").href = "https://www." + validURL;
		document.getElementById("profileTwitter").style.display = "block";
	}

	else {
		// display error message
		errorMessage[4].innerHTML = "Invalid URL! make sure the URL is formatted correctly."
		errorMessage[4].style.color = "#ef5350";
		return;
	}
}

// global for message
var errorMessage = document.getElementsByClassName("socialMediaError");

// remove github from account
function removeGithubURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileGithub").style.display = "none";
	document.getElementById("githubURL").value = "";
	var githubRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/github");
	githubRef.remove();

	// display message
	errorMessage[0].innerHTML = "GitHub succesfully removed from your profile!";
	errorMessage[0].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[0].innerHTML = "";
	}, 3000);
}

// remove linkedin from account
function removeLinkedinURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileLinkedin").style.display = "none";
	document.getElementById("linkedinURL").value = "";
	var linkedinRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/linkedin");
	linkedinRef.remove();

	// display message
	errorMessage[1].innerHTML = "LinkedIn succesfully removed from your profile!";
	errorMessage[1].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[1].innerHTML = "";
	}, 3000);

}

// remove instagram from accont
function removeInstagramURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileInstagram").style.display = "none";
	document.getElementById("instagramURL").value = "";
	var instagramRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/instagram");
	instagramRef.remove();

	// display message
	errorMessage[2].innerHTML = "Instagram succesfully removed from your profile!";
	errorMessage[2].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[2].innerHTML = "";
	}, 3000);

}

// remove facebook from account
function removeFacebookURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileFacebook").style.display = "none";
	document.getElementById("facebookURL").value = "";
	var facebookRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/facebook");
	facebookRef.remove();

	// display message
	errorMessage[3].innerHTML = "Facebook succesfully removed from your profile!";
	errorMessage[3].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[3].innerHTML = "";
	}, 3000);
}

// remove twitter from account
function removeTwitterURL() {
	// reset and remove data
	this.style.display = "none";
	document.getElementById("profileTwitter").style.display = "none";
	document.getElementById("twitterURL").value = "";
	var twitterRef = firebase.database().ref("accounts/" + uidKey + "/socialMedias/twitter");
	twitterRef.remove();

	// display message
	errorMessage[4].innerHTML = "Twitter succesfully removed from your profile!";
	errorMessage[4].style.color = "#9e9e9e";
	setTimeout(function() {
		errorMessage[4].innerHTML = "";
	}, 3000);
}

/********************************* END PROFILE ***********************************/



/******************************** PROJECT ***************************************/

// open new project modal
function openNewProject() {
	// open profile
	profile();

	// go to projects
	document.getElementById("gotoProjects").click();
	newProject();
}

// open my projects
function openMyProjects() {
	// open profile
	profile();

	// go to projects
	document.getElementById("gotoProjects").click();
	document.getElementById("myProjects").scrollIntoView();

	// scroll animation to my projects
	var ele = document.getElementById("myProjects");
	topPos = ele.offsetTop;
	console.log(topPos);
	$('#mainProfile').animate({
		scrollTop: topPos - 20,
	}, 1000);
}

// create a new project
function newProject() {
	// reset elements
	document.getElementById("newProjectFriends").innerHTML = "";
	document.getElementById("newProjectId").innerHTML = "";
	var inputs = document.getElementsByClassName("newProjectInput");
	for (var i = 0; i < inputs.length; i++) {
		inputs[i].value = "";
	}

	// init input events
	document.getElementById("newProjectName").addEventListener("keyup", newProjectName);
	document.getElementById("newProjectDesc").addEventListener("keyup", newProjectDesc);

	// init create project event
	document.getElementById("createProject").addEventListener("click", createProject);

	// load friends available to join project
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		console.log(snapshot.val());
		snapshot.forEach((child) => {
			
			// create friend container
			var cont = document.createElement("div");
			cont.id = "profile-" + child.key;
			cont.classList.add("col") + cont.classList.add("col-lg-6") + cont.classList.add("newProjectFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + child.key);

			// create avatar img
			var friendImg = document.createElement("img");
			friendImg.classList.add("newProjectFriendAvatar");

			// add select friend for project event
			friendImg.addEventListener("click", selectProjectFriend);

			// set img src to be avatar url
			friendRef = firebase.database().ref("accounts/" + child.key);
			friendRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					friendImg.src = snapshot.val().Avatar_url;
				}

				else {
					friendImg.src = "/img/avatar.png";
				}
			});

			// create friend name
			var friendName = document.createElement("h5");
			friendName.classList.add("friendsName") + friendName.classList.add("text-center");
			friendName.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

			// create friend email
			var friendEmail = document.createElement("p");
			friendEmail.classList.add("friendsEmail") + friendEmail.classList.add("text-center");
			friendEmail.innerHTML = child.val().Email;

			// append
			cont.appendChild(friendImg);
			cont.appendChild(friendName);
			cont.appendChild(friendEmail);

			// display
			document.getElementById("newProjectFriends").appendChild(cont);
  		});
	});

	// open modal
	$('#newProjectModal').modal('show');
}

// globals used for project check
var validProjectName = false;
var validProjectDesc = true;

// timer
var typingTimer;
var doneTypingInterval = 1000;
// check name and create project id
function newProjectName() {
	// get input
	var projectName = this;

	// form check
	if (projectName.value === "") {
		document.getElementById("projectNameError").innerHTML = "";
		validProjectName = false;
	}

	else if (projectName.value.length < 4) {
		document.getElementById("projectNameError").innerHTML = "Must be at least 4 characters long";
		validProjectName = false;
		return;
	}

	else if (projectName.value.length > 30) {
		document.getElementById("projectNameError").innerHTML = "Cannot be longer than 30 characters";
		validProjectName = false;
		return;
	}

	else {
		document.getElementById("projectNameError").innerHTML = "";
		validProjectName = true;
	}

	// start countdown
	clearTimeout(typingTimer);
  	typingTimer = setTimeout(doneTyping, doneTypingInterval);

  	// clear countdown
  	projectName.addEventListener("keydown", function () {
	  clearTimeout(typingTimer);
	});

	//user display generated id when user is done typing
	function doneTyping () {
		// replace space with binding
		var bind = projectName.value.replace(/ /g, "-");
	 	
	 	// generate e random id
	 	var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
	 	var id = "-";

	 	// create id
	  	for (var i = 0; i < 5; i++) {
	    	id += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		var projectId = bind + id;
		if (projectName.value === "") {
			document.getElementById("newProjectId").innerHTML = "";
		}

		// display the ID if the input is not empty
		else {
			document.getElementById("newProjectId").innerHTML = projectId.toLowerCase();
			console.log(projectId);
		}
	}
}

// project description
function newProjectDesc() {
	// form check
	var projectDesc = this;
	if (projectDesc.value === "") {
		document.getElementById("projectDescError").innerHTML = "";
		validProjectDesc = true;
	}

	else if (projectDesc.value.length > 255) {
		document.getElementById("projectDescError").innerHTML = "Connot be longer than 255 characters";
		validProjectDesc = false;
		return;
	}

	else {
		validProjectDesc = true;
	}
}

// select new project members / friends
function selectProjectFriend() {
	// check class
	if (this.classList.contains("selectedProjectMember")) {
		this.classList.remove("selectedProjectMember");
		this.parentElement.childNodes[1].classList.remove("selectedProjectMemberInfo");
		this.parentElement.childNodes[2].classList.remove("selectedProjectMemberInfo");
	}

	else {
		this.classList.add("selectedProjectMember");
		this.parentElement.childNodes[1].classList.add("selectedProjectMemberInfo");
		this.parentElement.childNodes[2].classList.add("selectedProjectMemberInfo");
	}
}

// create project and project referances
function createProject() {
	// check validation
	if (validProjectName === true && validProjectDesc === true) {

		// get project data
		var projectId = document.getElementById("newProjectId").innerHTML;
		var projectName = document.getElementById("newProjectName").value;
		var projectDesc = document.getElementById("newProjectDesc").value;
		var members = [];
		members.push(uidKey);
		
		// get selected friends to join project
		var selected = document.getElementsByClassName("selectedProjectMember");
		for (var i = 0; i < selected.length; i++) {
			var key = selected[i].parentElement.id.split("-")[1];
			members.push(key);
		}

		for (var i = 0; i < members.length; i++) {
			// set project to every member
			var memberRef = firebase.database().ref("accounts/" + members[i] + "/projects/" + projectId);
			memberRef.update({
				id: projectId,
				name: projectName,
				description: projectDesc,
				members: members
			});
		}

		// set project creator
		var leaderRef = firebase.database().ref("accounts/" + uidKey + "/projects/" + projectId);
		leaderRef.update({
			id: projectId,
			name: projectName,
			description: projectDesc,
			members: members
		});

		// create project and store data
		var projectRef = firebase.database().ref("projects/" + projectId);
		projectRef.update({
			id: projectId,
			name: projectName,
			description: projectDesc,
			members: members
		});

		// create leader ref
		var projectRoleRef = firebase.database().ref("projects/" + projectId + "/roles");
		projectRoleRef.update({
			leader: uidKey
		});

		// create project elements
		var cont = document.createElement("div");
		cont.classList.add("col-sm-6");
		cont.id = "project-" + projectId;

		var card = document.createElement("div");
		card.classList.add("card");

		var cardBody = document.createElement("div");
		cardBody.classList.add("card-body");

		var title = document.createElement("h5");
		title.classList.add("card-title") + title.classList.add("projectTitle");
		title.innerHTML = projectName.capitalizeFirstLetter();

		var id = document.createElement("p");
		id.classList.add("projectId");
		id.innerHTML = projectId.toLowerCase();

		var avatarRow = document.createElement("div");

		var btnCont = document.createElement("div");
		btnCont.classList.add("row") + btnCont.classList.add("col-sm-12") + btnCont.classList.add("gotoProject");

		var btn = document.createElement("a");
		btn.classList.add("btn") + btn.classList.add("gotoProjectBtn");
		btn.innerHTML = "Go to project";
		btn.style.color = "white";
		btn.addEventListener("click", openProject);

		var justCreated = document.createElement("p");
		justCreated.classList.add("justCreated");
		justCreated.innerHTML = "New!";

		// appends
		cardBody.appendChild(justCreated);
		cardBody.appendChild(title);
		cardBody.appendChild(id);
		cardBody.appendChild(avatarRow);

		// images
		for (var i = 0; i < members.length; i++) {
			var memberRef = firebase.database().ref("accounts/" + members[i]);
			memberRef.once("value", function(snapshot) {
				var avatar = document.createElement("img");
				avatar.id = "member-" + snapshot.key;
				avatar.classList.add("col-sm-2") + avatar.classList.add("projectAvatar");
				avatar.src = snapshot.val().Avatar_url;
				avatar.addEventListener("click", openProfile);
				avatarRow.appendChild(avatar);
			});
		}

		btnCont.appendChild(btn);
		cardBody.appendChild(btnCont);
		card.appendChild(cardBody);
		cont.appendChild(card);

		// display
		document.getElementById("projectsCont").appendChild(cont);

		// scroll animation to project
		$('#mainProfile').animate({
			scrollTop: $("#mainProfile")[0].scrollHeight,
		}, 1500);

		// close modal and show message
		$('#newProjectModal').modal('hide');
		snackbar.innerHTML = "Project succesfully created!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
	}
}

// open selected project
var selectedProject;
var selectedAvatar;
var projectId;
function openProject() {
	selectedProject = this.parentElement.parentElement.parentElement.parentElement.id.split("t-")[1];
	projectId = this.parentElement.parentElement.parentElement.parentElement.id.split("t-")[1];
	clear();

	// open project
	var project = document.getElementById("projectMain");
	project.style.display = "block";

	document.getElementById("teamsTrigger").click();
	//document.getElementById("timesheetTrigger").click();

	teams();
	members();
	reports();
	timesheet();

	console.log(projectId);
}

// teams section
function teams() {

	// init new team event
	document.getElementById("newTeam").addEventListener("click", openNewTeam);
	document.getElementById("cancelTeam").addEventListener("click", resetNewTeam);

	// check exsisting teams
	var projectRef = firebase.database().ref("projects/" + projectId + "/teams/");
	projectRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			// remove the new team option if its allready exist on the project
			console.log(child.val().name);
			document.getElementById(child.val().name).parentElement.remove();

			// load teams
			var mainCont = document.createElement("div");
			mainCont.classList.add("col-sm-3") + mainCont.classList.add("projectTeams");
			var cont = document.createElement("div");
			cont.classList.add("card") + cont.classList.add("teamCard");

			var img = document.createElement("img");
			img.src = "img/" + child.val().name + ".jpg";
			img.classList.add("card-img-top");

			var body = document.createElement("div");
			body.id = "team-" + child.val().name;

			body.classList.add("card-body") + body.classList.add(child.val().name + "-body");
			var overlay = document.createElement("div");
			overlay.classList.add("card-img-overlay");
			var open = document.createElement("h5");
			open.classList.add("enterCard") + open.classList.add("text-center") + open.classList.add("animated") + open.classList.add("pulse");
			open.innerHTML = "Enter";
			overlay.appendChild(open);
			overlay.addEventListener("click", enterTeam);

			var teamName = document.createElement("h5");
			teamName.innerHTML = child.val().name.capitalizeFirstLetter();

			body.appendChild(teamName);
			cont.appendChild(img);
			cont.appendChild(overlay);
			cont.appendChild(body);
			mainCont.appendChild(cont);
			document.getElementById("teamsCont").appendChild(mainCont);
		});
	});
}

// enter selected team
var teamName;
var backToTeamBool = false;
function enterTeam() {
	// hide current content
	document.getElementById("projectMain").style.display = "none";
	document.getElementById("missionName").style.display = "none";
	document.getElementById("missionTabsContainer").style.display = "none";
	document.getElementById("teamTabs").style.display = "inline-flex";
	document.getElementById("teamTabsContainer").style.display = "block";
	document.getElementById("teamName").style.display = "block";
	document.getElementById("missionTabs").style.display = "none";
	document.getElementById("teamMembers").innerHTML = "";
	document.getElementById("addTeamMembersContMain").innerHTML = "";

	// show team container
	document.getElementById("teamMain").style.display = "block";
	document.getElementById("missionsTrigger").click();

	// get team data
	if (backToTeamBool === true) {
		teamName = teamName;
		backToTeamBool = false;
	}

	else {
		teamName = this.parentElement.childNodes[2].id.split("-")[1];
		backToTeamBool = false;
	}

	document.getElementById("teamName").innerHTML = teamName.capitalizeFirstLetter();

	// load conversations
	loadConversations();

	// load missions
	loadMissions();

	// add new members to team
	addTeamMembers();

	// get team members
	var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/members");
	membersRef.once("value", function(snapshot) {
		membersCount = snapshot.val().length;
		snapshot.forEach((child) => {
			// create avatar img
			var teamMemberImg = document.createElement("img");
			teamMemberImg.id = teamName + "-member-" + child.val();
			teamMemberImg.classList.add("teamMemberImg") + teamMemberImg.classList.add("col-lg-1") + teamMemberImg.classList.add("animated") + teamMemberImg.classList.add("fadeIn");

			// set img src to be avatar url
			accRef = firebase.database().ref("accounts/" + child.val());
			accRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					teamMemberImg.src = snapshot.val().Avatar_url;
				}

				else {
					teamMemberImg.src = "/img/avatar.png";
				}

				document.getElementById("teamMembers").appendChild(teamMemberImg);
			});
		});

		// display amount of peoples notified if posting a new conversation
		document.getElementById("amountNotifiedConversation").innerHTML = (membersCount - 1) + " people will be notified";
	});

	// add event listener to return to project
	document.getElementById("backToProject").removeEventListener("click", backToTeam);
	document.getElementById("backToProject").addEventListener("click", backToProject);
}

// add new team members to add to selected team
function addTeamMembers() {
	document.getElementById("addTeamMembersContMain").innerHTML = "";
	$('#addTeamMembersCont').bind('click', function (e) { e.stopPropagation() });
	var membersRef = firebase.database().ref("projects/" + projectId + "/members");
	membersRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			var userRef = firebase.database().ref("accounts/" + child.val());
			userRef.once("value", function(snapshot) {

				var cont = document.createElement("div");
				cont.id = "newTeamMember-" + child.val();
				cont.classList.add("col-lg-12") + cont.classList.add("dropdown-item") + cont.classList.add("newTeamMemberOption");
				cont.addEventListener("click", selectNewTeamMembers);

				var avatarCont = document.createElement("div");
				avatarCont.classList.add("col-lg-3") + avatarCont.classList.add("addTeamMembersAvatarCont");
				var avatarImg = document.createElement("img");
				avatarImg.classList.add("addTeamMemberAvatar");
				avatarImg.src = snapshot.val().Avatar_url;
				avatarCont.appendChild(avatarImg);

				var nameCont = document.createElement("div");
				nameCont.classList.add("col-lg-9");
				var name = document.createElement("p");
				name.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
				nameCont.appendChild(name);

				cont.appendChild(avatarCont);
				cont.appendChild(nameCont);
				document.getElementById("addTeamMembersContMain").appendChild(cont);

				// only display members thats not allready in selected team
				var teamMembersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/members");
				teamMembersRef.once("value", function(snapshot) {
					snapshot.forEach((child) => {
						if (document.getElementById("newTeamMember-" + child.val()) != null) {
							document.getElementById("newTeamMember-" + child.val()).remove();
						}
					});
				});
			});
		});
	});
}

// select team members to join
var newTeamMembers = [];
function selectNewTeamMembers() {
	// check if member is allready selected
	document.getElementById("addTeamMembersBtn").style.border ="none";
	document.getElementById("addTeamMembersBtn").classList.add("addTeamMembersBtnConfirm");
	document.getElementById("addTeamMembersBtn").classList.add("fadeIn");
	document.getElementById("addTeamMembersBtn").addEventListener("click", confirmNewTeamMembers);
	if (newTeamMembers.length >= 1) {
		for (var i = 0; i < newTeamMembers.length; i++) {
			if (this.id.split("-")[1] === newTeamMembers[i]) {
				newTeamMembers.splice(i, 1);
				this.classList.remove("animated") + this.classList.remove("fadeIn");
				this.childNodes[1].childNodes[0].classList.remove("selectedNewTeamMember");
				console.log(newTeamMembers);
				if (newTeamMembers.length === 0) {
					document.getElementById("addTeamMembersBtn").style.border ="0.5px solid #eeeeee";
					document.getElementById("addTeamMembersBtn").classList.remove("addTeamMembersBtnConfirm");
					document.getElementById("addTeamMembersBtn").classList.remove("fadeIn");
					document.getElementById("addTeamMembersBtn").removeEventListener("click", confirmNewTeamMembers);
				}
				return;
			}

		}
	}

	// add to array if not selected
	newTeamMembers.push(this.id.split("-")[1]);
	this.classList.add("animated") + this.classList.add("fadeIn");
	this.childNodes[1].childNodes[0].classList.add("selectedNewTeamMember");
}

// add selected members and store in db
function confirmNewTeamMembers() {
	var count = 0;
	var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/members");
	membersRef.once("value", function(snapshot) {
		var membersCount = snapshot.val().length;
		for (var i = 0; i < newTeamMembers.length; i++) {
			var member = newTeamMembers[i];
			var newMemberRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/members");
			newMemberRef.update({
				[membersCount] : member
			});
			membersCount++;
			count++;
			document.getElementById("newTeamMember-" + member).remove();
			if (count === newTeamMembers.length) {
				newTeamMembers = [];
				document.getElementById("addTeamMembersBtn").style.border ="0.5px solid #eeeeee";
				document.getElementById("addTeamMembersBtn").classList.remove("addTeamMembersBtnConfirm");
				document.getElementById("addTeamMembersBtn").classList.remove("fadeIn");
				document.getElementById("addTeamMembersBtn").removeEventListener("click", confirmNewTeamMembers);
			}
		}
		setNewTeamAvatars();
		snackbar.innerHTML = "Members succesfully added!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
	});
}

function setNewTeamAvatars() {
	document.getElementById("teamMembers").innerHTML = "";
	var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/members");
	membersRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			var teamMemberImg = document.createElement("img");
			teamMemberImg.id = teamName + "-member-" + child.val();
			teamMemberImg.classList.add("teamMemberImg") + teamMemberImg.classList.add("col-lg-1") + teamMemberImg.classList.add("animated") + teamMemberImg.classList.add("fadeIn");

			// set img src to be avatar url
			accRef = firebase.database().ref("accounts/" + child.val());
			accRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					teamMemberImg.src = snapshot.val().Avatar_url;
				}

				else {
					teamMemberImg.src = "/img/avatar.png";
				}
				document.getElementById("teamMembers").appendChild(teamMemberImg);
			});
		});
	});
}

// load conversations for the selected team
function loadConversations() {
	// clear
	document.getElementById("conversationsCont").innerHTML = "";
	document.getElementById("conversationLinks").innerHTML = "";
	document.getElementById("teamMembers").scrollIntoView(true);

	// load conversations
	var conversationRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/conversations/");
	conversationRef.once("value", function(snapshot) {
		// create elements
		snapshot.forEach((child) => {
			// create links
			var link = document.createElement("a");
			link.id = "conversationLink-" + child.key;
			link.addEventListener("click", gotoConversation);
			link.classList.add("list-group-item") + link.classList.add("d-flex") + link.classList.add("justify-content-between") + link.classList.add("align-items-center") + link.classList.add("conversationLink");
			// link badge
			var linkBadge = document.createElement("span");
			linkBadge.classList.add("badge") + linkBadge.classList.add("linkBadge");

			// create container
			var cont = document.createElement("div");
			cont.id = "conversation-" + child.key;
			cont.classList.add("conversation") + cont.classList.add("col-lg-12") + cont.classList.add("animated") + cont.classList.add("fadeIn");

			// header
			var contHeader = document.createElement("div");
			contHeader.classList.add("conversationHeader") + contHeader.classList.add("col-lg-12");

			// img cont
			var imgCont = document.createElement("div");
			imgCont.classList.add("col-lg-1");

			// poster avatar
			var posterImg = document.createElement("img");
			posterImg.classList.add("conversationPosterImg");

			// set img src to be avatar url
			var posterRef = firebase.database().ref("accounts/" + child.val().author);
			posterRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					posterImg.src = snapshot.val().Avatar_url;
				}

				else {
					posterImg.src = "/img/avatar.png";
				}

				imgCont.appendChild(posterImg);
			});

			// create poster header and info cont
			var infoCont = document.createElement("div");
			infoCont.classList.add("conversationPosterInfoCont") + infoCont.classList.add("col-lg-9");

			// create heading
			var heading = document.createElement("h1");
			heading.classList.add("conversationHeading");
			heading.innerHTML = child.val().title.capitalizeFirstLetter();
			link.innerHTML = child.val().title.capitalizeFirstLetter();

			// poster name and date
			var span = document.createElement("span");
			var posterName = document.createElement("h5");
			posterName.classList.add("conversationPosterName");
			var posterDate = document.createElement("span");
			posterDate.classList.add("conversationDate");
			posterDate.innerHTML = child.val().datetime;

			// create conversation content
			var conversationContent = document.createElement("p");
			conversationContent.classList.add("conversationContent");
			conversationContent.innerHTML = child.val().content.capitalizeFirstLetter();

			// create divider
			var divider = document.createElement("div");
			divider.classList.add("dropdown-divider") + divider.classList.add("conversationDivider");

			// append to header
			infoCont.appendChild(heading);
			span.appendChild(posterName);
			span.appendChild(posterDate);
			infoCont.appendChild(span);
			contHeader.appendChild(imgCont);
			contHeader.appendChild(infoCont);


			cont.appendChild(contHeader);
			cont.appendChild(conversationContent);
			cont.appendChild(divider);

			// create body / comments
			var commentsCount = 0;
			var comments = document.createElement("div");
			comments.classList.add("conversationBody") + comments.classList.add("col-lg-12");
			var commentLikesID = child.key;
			var conversationCommentRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/conversations/" + child.key + "/comments");
			conversationCommentRef.once("value", function(snapshot) {
				// create comments
				snapshot.forEach((child) => {
					commentsCount++;
					// comment data cont
					var commentContentCont = document.createElement("div");
					commentContentCont.id = "comment-" + child.key;
					commentContentCont.classList.add("conversationCommentCont") + commentContentCont.classList.add("col-lg-9");

					// comment data
					var commentSpan = document.createElement("span");
					var commentName = document.createElement("h5");
					commentName.classList.add("conversationCommentName");

					// comment img container
					var commentImgCont = document.createElement("div");
					commentImgCont.classList.add("col-lg-1");

					// comment img
					var commentImg = document.createElement("img");
					commentImg.classList.add("conversationCommentImg");
					var commentUserRef = firebase.database().ref("accounts/" + child.val().author);
					commentUserRef.once("value", function(snapshot) {
						if (snapshot.val().Avatar_url != undefined) {
							commentImg.src = snapshot.val().Avatar_url;
						}

						else {
							commentImg.src = "/img/avatar.png";
						}

						commentName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
						commentImgCont.appendChild(commentImg);
					});

					// comment date
					var commentDate = document.createElement("span");
					commentDate.classList.add("conversationCommentDate");
					commentDate.innerHTML = child.val().datetime;

					// comment content
					var comment = document.createElement("p");
					comment.classList.add("commentContent");
					comment.innerHTML = child.val().content;

					// like
					var likeCont = document.createElement("div");
					likeCont.classList.add("col-lg-1") + likeCont.classList.add("likeCommentCont");
					likeCont.innerHTML = document.getElementById("masterLike").innerHTML;
					likeCont.childNodes[1].addEventListener("click", likeComment);


					// get amount of likes
					var likesCount = 0;
					var likesRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/conversations/" + commentLikesID + "/comments/" + child.key + "/likes");
					likesRef.once("value", function(snapshot) {
						snapshot.forEach((child) => {
							likesCount++;
							likeCont.childNodes[0].innerHTML = likesCount;

							// user only able to like a comment once
							if (child.val() === uidKey) {
								likeCont.childNodes[1].style.opacity = "1";
								likeCont.childNodes[1].removeEventListener("click", likeComment);
							}
						});
					});

					// create row with comment and display in DOM
					var row = document.createElement("div");
					row.classList.add("col-lg-12") + row.classList.add("row") + row.classList.add("commentRow");

					row.appendChild(commentImgCont);
					commentSpan.appendChild(commentName);
					commentSpan.appendChild(commentDate);
					commentContentCont.appendChild(commentSpan);
					commentContentCont.appendChild(comment);
					row.appendChild(commentContentCont);
					row.appendChild(likeCont);

					comments.appendChild(row);
				});

				// set comment count for badge
				linkBadge.innerHTML = document.getElementById("masterComment").innerHTML;
				linkBadge.childNodes[1].innerHTML = commentsCount;
				link.appendChild(linkBadge);
			});

			// append comments
			cont.appendChild(comments);

			// create footer
			var footer = document.createElement("div");
			footer.classList.add("conversationFooter") + footer.classList.add("col-lg-12");

			// footer img
			var footerImgCont = document.createElement("div");
			footerImgCont.classList.add("col-lg-1");

			// create img
			var footerImg = document.createElement("img");
			footerImg.classList.add("conversationFooterImg");
			var postCommentUserRef = firebase.database().ref("accounts/" + uidKey);
			postCommentUserRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					footerImg.src = snapshot.val().Avatar_url;
				}

				else {
					footerImg.src = "/img/avatar.png";
				}

				posterName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
				footerImgCont.appendChild(footerImg);
			});

			// create input cont
			var inputCont = document.createElement("div");
			inputCont.classList.add("col-lg-8");

			// create input field
			var input = document.createElement("input");
			input.classList.add("form-control") + input.classList.add("replyToConversation");
			input.placeholder = "Write a comment...";
			input.setAttribute("type", "text");

			// post button
			var btnCont = document.createElement("div");
			btnCont.classList.add("col-lg-1") + btnCont.classList.add("postConversationCommentBtnCont");
			var btn = document.createElement("a");
			btn.classList.add("postConversationCommentBtn");
			btn.innerHTML = "Post";

			// add post event
			btn.addEventListener("click", postConversationComment);
			btnCont.appendChild(btn);

			// append to footer
			inputCont.appendChild(input);
			footer.appendChild(footerImgCont);
			footer.appendChild(inputCont);
			footer.appendChild(btnCont);
			cont.appendChild(footer);

			// append to DOM
			document.getElementById("conversationLinks").appendChild(link);
			document.getElementById("conversationsCont").appendChild(cont);

		});

		// init scrollspy
		$('#conversationsContainer').scrollspy({ target: '#conversationsSidebar' })
	});

	// init post conversation event
	document.getElementById("postConversationBtn").addEventListener("click", postConversation);
}

// post conversation in team
function postConversation() {

	// get timestamp
	var now = new Date();
	var year = now.getFullYear(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + year + ' ' + hour + ':' + minute; 

	// get value
	var conversationTitle = document.getElementById("postConversationTitle")
	var conversationContent = document.getElementById("postConversationInput");
	var contID;

	// do check
	if (conversationTitle.value.length === 0) {
		return;
	}

	if (conversationContent.value.length === 0) {
		return;
	} 

	// post data and create in DOM
	else {
		contID = new Date().getTime();
		var conversationRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/conversations/" + contID);
		conversationRef.update({
			datetime: dateTime,
			author: uidKey,
			title: conversationTitle.value,
			content: conversationContent.value
		});
	}

	// create container
	var cont = document.createElement("div");
	cont.id = "conversation-" + contID;
	cont.classList.add("conversation") + cont.classList.add("col-lg-12") + cont.classList.add("animated") + cont.classList.add("fadeIn");

	// header
	var contHeader = document.createElement("div");
	contHeader.classList.add("conversationHeader") + contHeader.classList.add("col-lg-12");

	// img cont
	var imgCont = document.createElement("div");
	imgCont.classList.add("col-lg-1");

	// poster avatar
	var posterImg = document.createElement("img");
	posterImg.classList.add("conversationPosterImg");

	// set img src to be avatar url
	var posterRef = firebase.database().ref("accounts/" + uidKey);
	posterRef.once("value", function(snapshot) {
		if (snapshot.val().Avatar_url != undefined) {
			posterImg.src = snapshot.val().Avatar_url;
		}

		else {
			posterImg.src = "/img/avatar.png";
		}

		imgCont.appendChild(posterImg);
	});

	// create poster header and info cont
	var infoCont = document.createElement("div");
	infoCont.classList.add("conversationPosterInfoCont") + infoCont.classList.add("col-lg-9");

	// create heading
	var heading = document.createElement("h1");
	heading.classList.add("conversationHeading");
	heading.innerHTML = conversationTitle.value.capitalizeFirstLetter();

	// poster name and date
	var span = document.createElement("span");
	var posterName = document.createElement("h5");
	posterName.classList.add("conversationPosterName");
	var posterDate = document.createElement("span");
	posterDate.classList.add("conversationDate");
	posterDate.innerHTML = dateTime;

	// create conversation content
	var conversationContentP = document.createElement("p");
	conversationContentP.classList.add("conversationContent");
	conversationContentP.innerHTML = conversationContent.value.capitalizeFirstLetter();

	// create divider
	var divider = document.createElement("div");
	divider.classList.add("dropdown-divider") + divider.classList.add("conversationDivider");

	// append to header
	infoCont.appendChild(heading);
	span.appendChild(posterName);
	span.appendChild(posterDate);
	infoCont.appendChild(span);
	contHeader.appendChild(imgCont);
	contHeader.appendChild(infoCont);


	cont.appendChild(contHeader);
	cont.appendChild(conversationContentP);
	cont.appendChild(divider);

	// create body / comments
	var comments = document.createElement("div");
	comments.classList.add("conversationBody") + comments.classList.add("col-lg-12");
	cont.appendChild(comments);

	// create footer
	var footer = document.createElement("div");
	footer.classList.add("conversationFooter") + footer.classList.add("col-lg-12");

	// footer img
	var footerImgCont = document.createElement("div");
	footerImgCont.classList.add("col-lg-1");

	// create img
	var footerImg = document.createElement("img");
	footerImg.classList.add("conversationFooterImg");
	var postCommentUserRef = firebase.database().ref("accounts/" + uidKey);
	postCommentUserRef.once("value", function(snapshot) {
		if (snapshot.val().Avatar_url != undefined) {
			footerImg.src = snapshot.val().Avatar_url;
		}

		else {
			footerImg.src = "/img/avatar.png";
		}

		posterName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		footerImgCont.appendChild(footerImg);
	});

	// create input cont
	var inputCont = document.createElement("div");
	inputCont.classList.add("col-lg-8");

	// create input field
	var input = document.createElement("input");
	input.classList.add("form-control") + input.classList.add("replyToConversation");
	input.placeholder = "Write a comment...";
	input.setAttribute("type", "text");

	// post button
	var btnCont = document.createElement("div");
	btnCont.classList.add("col-lg-1") + btnCont.classList.add("postConversationCommentBtnCont");
	var btn = document.createElement("a");
	btn.classList.add("postConversationCommentBtn");
	btn.innerHTML = "Post";

	// add post event
	btn.addEventListener("click", postConversationComment);
	btnCont.appendChild(btn);

	// append to footer
	inputCont.appendChild(input);
	footer.appendChild(footerImgCont);
	footer.appendChild(inputCont);
	footer.appendChild(btnCont);
	cont.appendChild(footer);

	// append to DOM
	document.getElementById("conversationsCont").appendChild(cont);
}

// post conversation comment
function postConversationComment() {
	// get id
	var conversationID = this.parentElement.parentElement.parentElement.id.split("-")[1];

	// get timestamp
	var now = new Date();
	var year = now.getFullYear(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + year + ' ' + hour + ':' + minute; 

	// get value and do check
	var commentContent = this.parentElement.parentElement.childNodes[1].childNodes[0];
	if (commentContent.value.length === 0) {
		return;
	}

	var commentID = new Date().getTime();
	console.log(commentID);
	var conversationRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/conversations/" + conversationID + "/comments/" + commentID);
		conversationRef.update({
		datetime: dateTime,
		author: uidKey,
		content: commentContent.value
	});

	var conversation = document.getElementById("conversation-" + conversationID).childNodes[3];

	// comment data cont
	var commentContentCont = document.createElement("div");
	commentContentCont.Id = "comment-" + commentID;
	commentContentCont.classList.add("conversationCommentCont") + commentContentCont.classList.add("col-lg-9");

	// comment data
	var commentSpan = document.createElement("span");
	var commentName = document.createElement("h5");
	commentName.classList.add("conversationCommentName");

	// comment img container
	var commentImgCont = document.createElement("div");
	commentImgCont.classList.add("col-lg-1");

	// comment img
	var commentImg = document.createElement("img");
	commentImg.classList.add("conversationCommentImg");
	var commentUserRef = firebase.database().ref("accounts/" + uidKey);
	commentUserRef.once("value", function(snapshot) {
		if (snapshot.val().Avatar_url != undefined) {
			commentImg.src = snapshot.val().Avatar_url;
		}

		else {
			commentImg.src = "/img/avatar.png";
		}

		commentName.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		commentImgCont.appendChild(commentImg);
	});

	// comment date
	var commentDate = document.createElement("span");
	commentDate.classList.add("conversationCommentDate");
	commentDate.innerHTML = dateTime;

	// comment content
	var comment = document.createElement("p");
	comment.classList.add("commentContent");
	comment.innerHTML = commentContent.value;

	// like
	var likeCont = document.createElement("div");
	likeCont.classList.add("col-lg-1") + likeCont.classList.add("likeCommentCont");
	likeCont.innerHTML = document.getElementById("masterLike").innerHTML;
	likeCont.childNodes[1].addEventListener("click", likeComment);

	// create row with comment and display in DOM
	var row = document.createElement("div");
	row.classList.add("col-lg-12") + row.classList.add("row") + row.classList.add("commentRow") + row.classList.add("animated") + row.classList.add("fadeIn");

	row.appendChild(commentImgCont);
	commentSpan.appendChild(commentName);
	commentSpan.appendChild(commentDate);
	commentContentCont.appendChild(commentSpan);
	commentContentCont.appendChild(comment);
	row.appendChild(commentContentCont);
	row.appendChild(likeCont);

	conversation.appendChild(row);
}

// like a specific comment
function likeComment() {
	// remove event
	this.removeEventListener("click", likeComment);

	// styling
	var likes = this.parentElement.childNodes[0];
	this.style.opacity = "1";

	// set like
	if (likes.innerHTML === "") {
		likes.innerHTML = 1;
	}

	else {
		likes.innerHTML += 1;
	}

	// store like
	var conversationID = this.parentElement.parentElement.parentElement.parentElement.id.split("-")[1];
	var commentID = this.parentElement.parentElement.childNodes[1].id.split("-")[1];
	var commentRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/conversations/" + conversationID + "/comments/" + commentID + "/likes/");
		commentRef.update({
		liked_by: uidKey
	});
}

// go to selected conversation
function gotoConversation() {
	var selectedLink = this;
	var e = document.getElementById("conversation-" + this.id.split("-")[1]);
	e.classList.remove("fadeIn");
	e.classList.remove("fadeIn");
	e.style.removeProperty("margin-top");
	e.scrollIntoView(true);
	e.style.marginTop = "1px";
	e.classList.add("fadeIn");

   var links = document.getElementsByClassName("conversationLink");
   for (var i = 0; i < links.length; i++) {
   		links[i].classList.remove("selectedLink");
   }

   selectedLink.classList.add("selectedLink");
}

// load missions for selected team
function loadMissions() {
	// init new mission event
	document.getElementById("newMission").addEventListener("click", newMission);

	// load public missions / styles
	if (document.getElementById("missionsCont") != undefined) {
		document.getElementById("missionsCont").remove();
	}
	document.getElementById("newMission").classList.remove("bounce");
	document.getElementById("noMissions").style.display = "none";

	// crate main containers
	var container = document.createElement("div");
	container.id = "missionsCont";
	container.classList.add("row") + container.classList.add("col-lg-12");

	// public container
	var public = document.createElement("div");
	public.id = "publicMissionsCont";
	public.classList.add("col-lg-6");
	var publicHeading = document.createElement("h5");
	publicHeading.innerHTML = "Public";
	public.appendChild(publicHeading);

	// private container
	var private = document.createElement("div");
	private.id = "privateMissionsCont";
	private.classList.add("col-lg-6");
	var privateHeading = document.createElement("h5");
	privateHeading.innerHTML = "Private";
	private.appendChild(privateHeading);

	// append to DOM
	container.appendChild(public);
	container.appendChild(private);
	document.getElementById("missionsContainer").appendChild(container);

	// public ref
	var publicMissionsRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/public");
	publicMissionsRef.once("value", function(snapshot) {
		// create public missons
		snapshot.forEach((child) => {
			console.log(child.val());

			// create cont
			var cont = document.createElement("div");
			cont.id = "mission-public-" + child.key;
			cont.classList.add("col-lg-12") + cont.classList.add("publicMission") + cont.classList.add("row");
			cont.addEventListener("click", enterMission);

			// sidebar
			var sideBar = document.createElement("div");
			sideBar.classList.add("col-lg-1") + sideBar.classList.add("missionSidebar");
			cont.appendChild(sideBar); 

			// name
			var nameCont = document.createElement("div");
			nameCont.classList.add("col-lg-6") + nameCont.classList.add("publicMissionName");
			var name = document.createElement("p");
			name.innerHTML = child.val().mission_name.capitalizeFirstLetter();
			nameCont.appendChild(name);
			cont.appendChild(nameCont);


			public.appendChild(cont);
		});

		if (snapshot.val() != undefined || snapshot.val() != null) {
			document.getElementById("noMissions").style.display = "none";
		}

		else {
			document.getElementById("noMissions").style.display = "block";
			container.remove();
			setTimeout(function() {
				document.getElementById("newMission").classList.add("bounce");
			}, 1000);
		}
	});

	// private ref
	var privateMissionsRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/private");
	privateMissionsRef.once("value", function(snapshot) {
		// create public missons
		snapshot.forEach((child) => {
			console.log(child.val());

			// create cont
			var cont = document.createElement("div");
			cont.id = "mission-private-" + child.key;
			cont.classList.add("col-lg-12") + cont.classList.add("privateMission") + cont.classList.add("row");
			cont.addEventListener("click", enterMission);

			// sidebar
			var sideBar = document.createElement("div");
			sideBar.classList.add("col-lg-1") + sideBar.classList.add("missionSidebarPrivate");
			cont.appendChild(sideBar); 

			// name
			var nameCont = document.createElement("div");
			nameCont.classList.add("col-lg-6") + nameCont.classList.add("privateMissionName");
			var name = document.createElement("p");
			name.innerHTML = child.val().mission_name.capitalizeFirstLetter();
			nameCont.appendChild(name);
			cont.appendChild(nameCont);


			private.appendChild(cont);
		});
	});
}

// enter selected mission
var category;
var missionID;
var missionSharedWith;
function enterMission() {
	// add event listener to return to team
	document.getElementById("backToProject").removeEventListener("click", backToProject);
	document.getElementById("backToProject").addEventListener("click", backToTeam);

	// get selected mission
	category = this.id.split("-")[1];
	missionID = this.id.split("-")[2];
	var missionRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID);
	missionRef.once("value", function(snapshot) {
		// DOM manipultaton - show / hide components
		document.getElementById("teamName").style.display = "none";
		document.getElementById("missionName").style.display = "block";
		document.getElementById("teamTabs").style.display = "none";
		document.getElementById("teamTabsContainer").style.display = "none";
		document.getElementById("missionTabs").style.display = "inline-flex";
		document.getElementById("missionTabsContainer").style.display = "block";
		document.getElementById("missionTasksTrigger").click();
		document.getElementById("missionName").innerHTML = snapshot.val().mission_name.capitalizeFirstLetter();
		document.getElementById("missionNameTask").innerHTML = snapshot.val().mission_name.capitalizeFirstLetter();
		document.getElementById("teamMembers").innerHTML = "";
		document.getElementById("addTeamMembersContMain").innerHTML = "";

		// create avatar img for mission admin
		var teamMemberImg = document.createElement("img");
		teamMemberImg.id = teamName + "-" + missionID + "-" + snapshot.val().mission_admin;
		teamMemberImg.classList.add("teamMemberImg") + teamMemberImg.classList.add("col-lg-1") + teamMemberImg.classList.add("animated") + teamMemberImg.classList.add("fadeIn");

		// set img src to be avatar url
		var accRef = firebase.database().ref("accounts/" + snapshot.val().mission_admin);
		accRef.once("value", function(snapshot) {
			if (snapshot.val().Avatar_url != undefined) {
				teamMemberImg.src = snapshot.val().Avatar_url;
			}

			else {
				teamMemberImg.src = "/img/avatar.png";
			}

			document.getElementById("teamMembers").appendChild(teamMemberImg);
		});

		// create avatars for members
		var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/members");
		membersRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				var teamMemberImg = document.createElement("img");
				teamMemberImg.id = teamName + "-" + missionID + "-" + child.key;
				teamMemberImg.classList.add("teamMemberImg") + teamMemberImg.classList.add("col-lg-1") + teamMemberImg.classList.add("animated") + teamMemberImg.classList.add("fadeIn");

				// set img src to be avatar url
				var accRef = firebase.database().ref("accounts/" + child.key);
				accRef.once("value", function(snapshot) {
					if (snapshot.val().Avatar_url != undefined) {
						teamMemberImg.src = snapshot.val().Avatar_url;
					}

					else {
						teamMemberImg.src = "/img/avatar.png";
					}

					document.getElementById("teamMembers").appendChild(teamMemberImg);
				});
			});
		});

		// mission functions and modules
		missionSharedWith = snapshot.val().shared_with;
		missionTasks();
		addMissionMembers();
		unassignedTask();
		dueDate();
		calendar();
	});
}

// load members available to join the mission
function addMissionMembers() {
	document.getElementById("addTeamMembersBtn").removeEventListener("click", confirmNewTeamMembers);
	$('#addTeamMembersCont').bind('click', function (e) { e.stopPropagation() });
	var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/members");
	membersRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			var userRef = firebase.database().ref("accounts/" + child.val());
			userRef.once("value", function(snapshot) {

				var cont = document.createElement("div");
				cont.id = "newMissionMember-" + child.val();
				cont.classList.add("col-lg-12") + cont.classList.add("dropdown-item") + cont.classList.add("newTeamMemberOption");
				cont.addEventListener("click", selectNewMissionMembers);

				var avatarCont = document.createElement("div");
				avatarCont.classList.add("col-lg-3") + avatarCont.classList.add("addTeamMembersAvatarCont");
				var avatarImg = document.createElement("img");
				avatarImg.classList.add("addTeamMemberAvatar");
				avatarImg.src = snapshot.val().Avatar_url;
				avatarCont.appendChild(avatarImg);

				var nameCont = document.createElement("div");
				nameCont.classList.add("col-lg-9");
				var name = document.createElement("p");
				name.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
				nameCont.appendChild(name);

				cont.appendChild(avatarCont);
				cont.appendChild(nameCont);

				var missionRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID);
				missionRef.once("value", function(snapshot) {
					if (cont.id.split("-")[1] != snapshot.val().mission_admin) {
						document.getElementById("addTeamMembersContMain").appendChild(cont);
					}
				});
			});
		});

		// shared with ref
		var membersSharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/members");
		membersSharedRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				var userRef = firebase.database().ref("accounts/" + child.val());
				userRef.once("value", function(snapshot) {

					var cont = document.createElement("div");
					cont.id = "newMissionMember-" + child.val();
					cont.classList.add("col-lg-12") + cont.classList.add("dropdown-item") + cont.classList.add("newTeamMemberOption");
					cont.addEventListener("click", selectNewMissionMembers);
					// check if allready appended to DOM, remove if true
					if (document.getElementById("newMissionMember-" + child.val()) != null) {
						document.getElementById("newMissionMember-" + child.val()).remove();
					}

					var avatarCont = document.createElement("div");
					avatarCont.classList.add("col-lg-3") + avatarCont.classList.add("addTeamMembersAvatarCont");
					var avatarImg = document.createElement("img");
					avatarImg.classList.add("addTeamMemberAvatar");
					avatarImg.src = snapshot.val().Avatar_url;
					avatarCont.appendChild(avatarImg);

					var nameCont = document.createElement("div");
					nameCont.classList.add("col-lg-9");
					var name = document.createElement("p");
					name.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
					nameCont.appendChild(name);

					cont.appendChild(avatarCont);
					cont.appendChild(nameCont);
					document.getElementById("addTeamMembersContMain").appendChild(cont);

					// check if member allready is in mission
					var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/members");
					membersRef.once("value", function(snapshot) {
						snapshot.forEach((child) => {
							if (cont.id.split("-")[1] != child.key) {
								if (document.getElementById("newMissionMember-" + child.val()) != null) {
									document.getElementById("newMissionMember-" + child.val()).remove();
								}
							}
						});
					});

					// dont display mission admin
					var missionRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID);
					missionRef.once("value", function(snapshot) {
						if (cont.id.split("-")[1] === snapshot.val().mission_admin) {
							document.getElementById("newMissionMember-" + snapshot.val().mission_admin).remove();
						}
					});
				});
			});
		});
	});
}

// get sekected mission members
var newMissionMembers = [];
function selectNewMissionMembers() {
	// check if member is allready selected
	document.getElementById("addTeamMembersBtn").style.border ="none";
	document.getElementById("addTeamMembersBtn").classList.add("addTeamMembersBtnConfirm");
	document.getElementById("addTeamMembersBtn").classList.add("fadeIn");
	document.getElementById("addTeamMembersBtn").addEventListener("click", confirmNewMissionMembers);
	if (newMissionMembers.length >= 1) {
		for (var i = 0; i < newMissionMembers.length; i++) {
			if (this.id.split("-")[1] === newMissionMembers[i]) {
				newMissionMembers.splice(i, 1);
				this.classList.remove("animated") + this.classList.remove("fadeIn");
				this.childNodes[1].childNodes[0].classList.remove("selectedNewTeamMember");
				if (newMissionMembers.length === 0) {
					document.getElementById("addTeamMembersBtn").style.border ="0.5px solid #eeeeee";
					document.getElementById("addTeamMembersBtn").classList.remove("addTeamMembersBtnConfirm");
					document.getElementById("addTeamMembersBtn").classList.remove("fadeIn");
					document.getElementById("addTeamMembersBtn").removeEventListener("click", confirmNewMissionMembers);
				}
				return;
			}

		}
	}

	// add to array if not selected
	newMissionMembers.push(this.id.split("-")[1]);
	this.classList.add("animated") + this.classList.add("fadeIn");
	this.childNodes[1].childNodes[0].classList.add("selectedNewTeamMember");
}

// store and add new mission members
function confirmNewMissionMembers() {
	var count = 0;
	var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/members");
	for (var i = 0; i < newMissionMembers.length; i++) {
		var member = newMissionMembers[i];
		membersRef.update({
			[member] : member
		});
		count++;
	}

	var membersSharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/members");
	for (var i = 0; i < newMissionMembers.length; i++) {
		var member = newMissionMembers[i];
		document.getElementById("newMissionMember-" + member).remove();
		membersSharedRef.update({
			[member] : member
		});
	}

	if (count === newMissionMembers.length) {
		newmissionMembers = [];
		document.getElementById("addTeamMembersBtn").style.border ="0.5px solid #eeeeee";
		document.getElementById("addTeamMembersBtn").classList.remove("addTeamMembersBtnConfirm");
		document.getElementById("addTeamMembersBtn").classList.remove("fadeIn");
		document.getElementById("addTeamMembersBtn").removeEventListener("click", confirmNewMissionMembers);
	}
	setNewMissionAvatars();
	snackbar.innerHTML = "Members succesfully added!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// update images with avatars after adding new members
function setNewMissionAvatars() {
	document.getElementById("teamMembers").innerHTML = "";
	var missionRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID);
	missionRef.once("value", function(snapshot) {
		// create avatar img for mission admin
		var teamMemberImg = document.createElement("img");
		teamMemberImg.id = teamName + "-" + missionID + "-" + snapshot.val().mission_admin;
		teamMemberImg.classList.add("teamMemberImg") + teamMemberImg.classList.add("col-lg-1") + teamMemberImg.classList.add("animated") + teamMemberImg.classList.add("fadeIn");

		// set img src to be avatar url
		var accRef = firebase.database().ref("accounts/" + snapshot.val().mission_admin);
		accRef.once("value", function(snapshot) {
			if (snapshot.val().Avatar_url != undefined) {
				teamMemberImg.src = snapshot.val().Avatar_url;
			}

			else {
				teamMemberImg.src = "/img/avatar.png";
			}

			document.getElementById("teamMembers").appendChild(teamMemberImg);
		});
		// create members avatars
		var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/members");
		membersRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				var teamMemberImg = document.createElement("img");
				teamMemberImg.id = teamName + "-" + missionID + "-" + child.key;
				teamMemberImg.classList.add("teamMemberImg") + teamMemberImg.classList.add("col-lg-1") + teamMemberImg.classList.add("animated") + teamMemberImg.classList.add("fadeIn");

				// set img src to be avatar url
				accRef = firebase.database().ref("accounts/" + child.key);
				accRef.once("value", function(snapshot) {
					if (snapshot.val().Avatar_url != undefined) {
						teamMemberImg.src = snapshot.val().Avatar_url;
					}

					else {
						teamMemberImg.src = "/img/avatar.png";
					}
					document.getElementById("teamMembers").appendChild(teamMemberImg);
				});
			});
		});
	});
}

// init and prep tasks for selected mission
var currentTask;
function missionTasks() {
	// clear and reset
	document.getElementById("tasksCont").innerHTML = "";
	document.getElementById("calendarMain").innerHTML = "";

	// init event for new mission
	document.getElementById("addTask").addEventListener("click", newTask);
	document.getElementById("closeTaskCont").addEventListener("click", closeTask);

	// load tasks
	var taskCount = 0;
	var missionTasksRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/");
	missionTasksRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			taskCount++;
			// create elements
			var cont = document.createElement("div");
			cont.classList.add("row") + cont.classList.add("col-lg-12") + cont.classList.add("taskCont") + cont.classList.add("animated") + cont.classList.add("fadeIn");
			cont.innerHTML = document.getElementById("masterTask").innerHTML;
			cont.id = "mission-task-" + child.key;
			cont.addEventListener("click", openTask);

			// set member task is assigned to
			var missionTasksAssignedRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + child.key + "/assigned");
			missionTasksAssignedRef.once("value", function(snapshot) {
				// set img src to be avatar url
				if (snapshot.val() != null) {
					accRef = firebase.database().ref("accounts/" + snapshot.val().assigned_to);
					accRef.once("value", function(snapshot) {
						if (snapshot.val().Avatar_url != undefined) {
							cont.childNodes[5].childNodes[0].src = snapshot.val().Avatar_url;
						}

						else {
							cont.childNodes[5].childNodes[0].src.src = "/img/avatar.png";
						}
					});
				}
			});

			// set status
			var icon = document.getElementById("checkTaskCompletedMain").childNodes[0];
			var taskIcon = cont.childNodes[1].childNodes[0].childNodes[0];

			// check if status is set
			if (child.val().status != null) {
				// not started
				if (child.val().status === "not started") {
					icon.style.stroke = "#ef5350";
					taskIcon.style.stroke = "#ef5350";
				}

				// in progress
				if (child.val().status === "in progress") {
					icon.style.stroke = "#fbc02d";
					taskIcon.style.stroke = "#fbc02d";
				}

				// completed
				if (child.val().status === "completed") {
					icon.style.stroke = "#66bb6a";
					taskIcon.style.stroke = "#66bb6a";
				}
			}

			// set name
			var parentName = cont.childNodes[3].childNodes[1].parentElement;
			cont.childNodes[3].childNodes[1].remove();
			var name = document.createElement("p");
			name.classList.add("animated") + name.classList.add("fadeIn");
			name.style.marginBottom = "0";
			name.style.wordBreak = "break-all";
			name.innerHTML = child.val().task_name.capitalizeFirstLetter();
			parentName.appendChild(name);


			// append to DOM
			document.getElementById("tasksCont").appendChild(cont);

			// open most recent task in main task view
			document.getElementById("taskMenu").style.display = "none";
			if (taskCount === snapshot.numChildren()) {
				cont.click();
			}
		});
	});

	// init task status triggers
	var triggers = document.getElementsByClassName("taskStatusTrigger");
	for (var i = 0; i < triggers.length; i++) {
		triggers[i].addEventListener("click", setTaskStatus);
	} 
}

// init events for due date
function dueDate() {
	// open modal
	document.getElementById("setTaskDate").addEventListener("click", openDueDate);

	// sliders
	document.getElementById("sliderHour").addEventListener("input", getSliderHour);
	document.getElementById("sliderMin").addEventListener("input", getSliderMin);
}

// get hour value
function getSliderHour() {
	var value = this.value;
	if (value.length == 1) {
		value = "0" + value;
	}
	document.getElementById("timePickerHour").innerHTML = value;
}

// get minute value
function getSliderMin() {
	var value = this.value;
	if (value.length == 1) {
		value = "0" + value;
	}
	document.getElementById("timePickerMin").innerHTML = value;
}

var todayModal;
var constMonth;
var currentMonthModal;
var currentYearModal;
var currentDateModal;
var navigationCountModal = 0;
var totalNavs = 0;
const monthNamesModal = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
function openDueDate() {
	// clear and reset
	document.getElementById("calendarDueDate").innerHTML = "";

	// set slide values
	var now = new Date();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	document.getElementById("sliderHour").value = hour;
	document.getElementById("sliderMin").value = minute;
	document.getElementById("timePickerHour").innerHTML = hour;
	document.getElementById("timePickerMin").innerHTML = minute;

	// open modal
	$('#dueDateModal').modal('show');

	// init events
	document.getElementById("nextMonthDueDate").addEventListener("click", nextMonthDueDate);
	document.getElementById("prevMonthDueDate").addEventListener("click", prevMonthDueDate);

	// get stats
	var getYear = new Date().getFullYear();
	var getMonth = new Date().getMonth();
	constMonth = new Date().getMonth();
	currentMonthModal = getMonth;
	currentYearModal = getYear;

	// week days
	var date = new Date();
	var weekday = new Array(7);
	weekday[0] =  "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";

	var dayName = weekday[date.getDay()];
	document.getElementById("monthAndYearDueDate").innerHTML = monthNamesModal[getMonth] + " " + getYear;
	todayModal = new Date().getDate();

	// get current month days
	var getMonthDays = new Date(getYear, getMonth, 0).getDate();
	currentDateModal = getMonthDays;
	var count = 0;

	// create elements after amount of month days
	for (var i = 1; i < getMonthDays; i++) {
		count++;
		var day = document.createElement("div");
		day.addEventListener("click", selectDate);
		day.id = "dueDate-" + i + "-" + (currentMonthModal + 1) + "-" + currentYearModal;
		day.classList.add("col-lg-1") + day.classList.add("text-center") + day.classList.add("animated") + day.classList.add("fadeIn");

		// style days depending on prev / after today
		if (i < today) {
			day.classList.add("oldCalendarDayDueDate");
		}

		else if (i >= today) {
			day.classList.add("calendarDayDueDate");
		}

		day.innerHTML = i;
		document.getElementById("calendarDueDate").appendChild(day);

		if (count === 7) {
			var breakWeek = document.createElement("div");
			breakWeek.classList.add("w-100");
			document.getElementById("calendarDueDate").appendChild(breakWeek);
			count = 0;
		}

		// check for task selected due date
		if (document.getElementById("dueDate-" + taskDueDate) != undefined) {
			document.getElementById("dueDate-" + taskDueDate).classList.add("calendarActive");
		}
	}
}

// display next month
var monthDueDate;
var yearDueDate;
var notCurrentYearDueDate = true;
var yearCountDueDate = 0;
function nextMonthDueDate() {
	navigationCountModal++;

	// get year and month
	if (notCurrentYearDueDate === true) {
		monthDueDate = currentMonthModal + (navigationCountModal - 1);
		notCurrentYearDueDate = false;
	}

	if (monthDueDate === 11) {
		monthDueDate = 0;
		navigationCountModal = 0;
		yearCountDueDate++;
	}

	else {
		monthDueDate++;
	}

	yearDueDate = currentYearModal + yearCountDueDate;

	// reset and clear
	document.getElementById("calendarDueDate").innerHTML = "";

	// get amount of days in month
	var getMonthDays = new Date(yearDueDate, monthDueDate + 1, 0).getDate();
	var count = 0;

	// displays current year and month
	document.getElementById("monthAndYearDueDate").innerHTML = monthNamesModal[monthDueDate] + " " + yearDueDate;

	// create elements after amount of month days
	for (var i = 1; i < getMonthDays + 1; i++) {
		count++;
		var day = document.createElement("div");
		day.addEventListener("click", selectDate);
		day.id = "dueDate-" + i + "-" + (monthDueDate + 1) + "-" + yearDueDate;
		day.classList.add("col-lg-1") + day.classList.add("text-center") + day.classList.add("animated") + day.classList.add("fadeIn");
		day.innerHTML = i;

		// check if current month navigated to is current month
		if (i < todayModal && monthDueDate === currentMonthModal && yearDueDate === currentYearModal) {
			day.classList.add("oldCalendarDayDueDate");
		}

		else if (i >= todayModal && monthDueDate === currentMonthModal && yearDueDate === currentYearModal) {
			day.classList.add("calendarDayDueDate");
		}

		else if (monthDueDate < currentMonthModal && yearDueDate === currentYearModal) {
			day.classList.add("oldCalendarDayDueDate");
		}

		else {
			day.classList.add("calendarDayDueDate");
		}

		// append to DOM
		document.getElementById("calendarDueDate").appendChild(day);

		// break line into rows for every week
		if (count === 7) {
			var breakWeek = document.createElement("div");
			breakWeek.classList.add("w-100");
			document.getElementById("calendarDueDate").appendChild(breakWeek);
			count = 0;
		}

		// check for task selected due date
		if (document.getElementById("dueDate-" + taskDueDate) != undefined) {
			document.getElementById("dueDate-" + taskDueDate).classList.add("calendarActive");
		}
	}
}

// display previous month
function prevMonthDueDate() {
	navigationCountModal--;

	// get year and month
	if (notCurrentYearDueDate === true) {
		monthDueDate = currentMonthModal - (navigationCountModal + 1);
		notCurrentYearDueDate = false;
	}

	if (monthDueDate === 0) {
		monthDueDate = 11;
		navigationCountModal = 0;
		yearCountDueDate--;
	}

	else {
		monthDueDate--;
	}

	yearDueDate = currentYearModal + yearCountDueDate;

	document.getElementById("monthAndYearDueDate").innerHTML = monthNamesModal[monthDueDate] + " " + yearDueDate;

	// reset and clear
	document.getElementById("calendarDueDate").innerHTML = "";
	var getMonthDays = new Date(yearDueDate, monthDueDate + 1, 0).getDate();
	var count = 0;

	// create elements after amount of month days
	for (var i = 1; i < getMonthDays + 1; i++) {
		count++;
		var day = document.createElement("div");
		day.addEventListener("click", selectDate);
		day.id = "dueDate-" + i + "-" + (monthDueDate + 1) + "-" + yearDueDate;
		day.classList.add("col-lg-1") + day.classList.add("text-center") + day.classList.add("animated") + day.classList.add("fadeIn");
		day.innerHTML = i;

		// check if current month navigated to is current month
		if (i < todayModal && monthDueDate === currentMonthModal && yearDueDate === currentYearModal) {
			day.classList.add("oldCalendarDayDueDate");
		}

		else if (i >= todayModal && monthDueDate === currentMonthModal && yearDueDate === currentYearModal) {
			day.classList.add("calendarDayDueDate");
		}

		else if (monthDueDate > currentMonthModal && yearDueDate === currentYearModal) {
			day.classList.add("calendarDayDueDate");
		}

		else {
			day.classList.add("oldCalendarDayDueDate");
		}

		// append to DOM
		document.getElementById("calendarDueDate").appendChild(day);

		// break line into rows for every week
		if (count === 7) {
			var breakWeek = document.createElement("div");
			breakWeek.classList.add("w-100");
			document.getElementById("calendarDueDate").appendChild(breakWeek);
			count = 0;
		}

		// check for task selected due date
		if (document.getElementById("dueDate-" + taskDueDate) != undefined) {
			document.getElementById("dueDate-" + taskDueDate).classList.add("calendarActive");
		}
	}
}

// set selected date as tasks due date
var selectedDueDate;
function setDueDate() {
	// check for invalid dates
	if (setDueDate != null || setDueDate != undefined) {
		if (selectedDueDate.classList.contains("oldCalendarDayDueDate")) {
			document.getElementById("dueDateError").style.display = "block";			
			return;
		}

		// get data and store
		else {
			var date = selectedDueDate.id.split("dueDate-")[1];
			var hour = document.getElementById("sliderHour").value;
			var min = document.getElementById("sliderMin").value;
			if (hour.length == 1) {
				hour = "0" + hour;
			}

			if (min.length == 1) {
				min = "0" + min;
			}

			var time = hour + ":" + min;
			
			// due date refs
			var dueDateRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/due_date");
			var dueDateSharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/due_date");

			// store
			dueDateRef.update({
				date: date,
				time: time,
				commiter: uidKey
			})
			dueDateSharedRef.update({
				date: date,
				time: time,
				commiter: uidKey
			})

			// replace - with /
			date = date.replace(/-/g, "<span class='dueDateSlash'>/</span>");
	
			// display in DOM
			document.getElementById("dueDate").innerHTML = date + " <span id='dueDateTime'>" + time + "</span>";
			document.getElementById("dueDate").style.color = "#8c9eff";
			document.getElementsByClassName("taskDueDateIcon")[0].style.border = "1px solid #8c9eff";
			document.getElementsByClassName("taskDueDateIcon")[0].childNodes[0].style.stroke = "8c9eff";

			// reset and clear
			document.getElementById("dueDateError").style.display = "none";			
			document.getElementById("calendarDueDate").innerHTML = "";
			document.getElementById("selectedDateInfo").innerHTML = "";
			document.getElementById("selectedDate").innerHTML = "";
			this.style.opacity = "0.3";

			// display message
			snackbar.innerHTML = "Task due date updated!";
			snackbar.className = "show";
			setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

			// activity ref
			var now = new Date(); 
			var month = now.getMonth()+1; 
			var day = now.getDate();
			var hour = now.getHours();
			var minute = now.getMinutes();

			// add zeros if needed
			if (month.toString().length == 1) {
				var month = '0' + month;
			}
			if (day.toString().length == 1) {
				var day = '0' + day;
			}   
			if (hour.toString().length == 1) {
				var hour = '0' + hour;
			}
			if (minute.toString().length == 1) {
				var minute = '0' + minute;
			}

			// store in activity
			var dateTime = day + '.' + month + ' ' + hour + ':' + minute;
			var taskActivityRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity/" + now.getTime());
			var taskActivitySharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity/" + now.getTime());

			taskActivityRef.update({
				commiter: uidKey,
				activity: "updated task due date",
				timestamp: dateTime
			});
			taskActivitySharedRef.update({
				commiter: uidKey,
				activity: "updated task due date",
				timestamp: dateTime
			});

			var assignerRef = firebase.database().ref("accounts/" + uidKey);
			assignerRef.once("value", function(snapshot) {
				// display activity
				var newAcitivty = document.createElement("p");
				newAcitivty.classList.add("taskActivity") + newAcitivty.classList.add("animated") + newAcitivty.classList.add("fadeIn");
				newAcitivty.innerHTML = "<span class='taskActivityCreator'>" + document.getElementById("masterMapIcon").innerHTML + " " + snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() + "</span> updated task due date" + "<span class='taskActivityDate'>" + document.getElementById("masterTimeIcon").innerHTML + " " + dateTime + "</span>"; 
				document.getElementById("missionTaskActivity").insertBefore(newAcitivty, document.getElementById("missionTaskActivity").childNodes[0]);
			});

			// close modal
			$('#dueDateModal').modal('hide');
		}
	}
}

// set status for selected task
function setTaskStatus() {
	// elements and id
	var icon = document.getElementById("checkTaskCompletedMain").childNodes[0];
	var taskIcon = document.getElementById("mission-task-" + taskID).childNodes[1].childNodes[0].childNodes[0];
	var status = this.id.split("-")[1];

	// status ref
	var statusRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID);
	var statusSharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskID);

	// not started
	if (status === "notStarted") {
		icon.style.stroke = "#ef5350";
		taskIcon.style.stroke = "#ef5350";
		statusRef.update({
			status: "not started"
		});
		statusSharedRef.update({
			status: "not started"
		});

	}

	// in progress
	if (status === "inProgress") {
		icon.style.stroke = "#fbc02d";
		taskIcon.style.stroke = "#fbc02d";
		statusRef.update({
			status: "in progress"
		});
		statusSharedRef.update({
			status: "in progress"
		});

	}

	// completed
	if (status === "completed") {
		icon.style.stroke = "#66bb6a";
		taskIcon.style.stroke = "#66bb6a";
		statusRef.update({
			status: "completed"
		});
		statusSharedRef.update({
			status: "completed"
		});
	}

	// get time stamp
	var now = new Date(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + hour + ':' + minute;

	// activity ref
	var taskActivityRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity/" + now.getTime());
	var taskActivitySharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity/" + now.getTime());

	taskActivityRef.update({
		commiter: uidKey,
		activity: "updated task status",
		target: status,
		timestamp: dateTime
	});
	taskActivitySharedRef.update({
		commiter: uidKey,
		activity: "updated task status",
		target: status,
		timestamp: dateTime
	});

	var assignerRef = firebase.database().ref("accounts/" + uidKey);
	assignerRef.once("value", function(snapshot) {
		// display activity
		var newAcitivty = document.createElement("p");
		newAcitivty.classList.add("taskActivity") + newAcitivty.classList.add("animated") + newAcitivty.classList.add("fadeIn");
		newAcitivty.innerHTML = "<span class='taskActivityCreator'>" + document.getElementById("masterMapIcon").innerHTML + " " + snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() + "</span> updated task status" + "<span class='taskActivityDate'>" + document.getElementById("masterTimeIcon").innerHTML + " " + dateTime + "</span>"; 
		document.getElementById("missionTaskActivity").insertBefore(newAcitivty, document.getElementById("missionTaskActivity").childNodes[0]);
	});

	// display message
	snackbar.innerHTML = "Task status updated!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// close taskContainer
function closeTask() {
	document.getElementById("taskMenu").style.display = "none";
}

// set a new task
function newTask() {
	// create element
	var cont = document.createElement("div");
	cont.classList.add("row") + cont.classList.add("col-lg-12") + cont.classList.add("taskCont") + cont.classList.add("animated") + cont.classList.add("fadeIn");
	cont.innerHTML = document.getElementById("masterTask").innerHTML;
	cont.childNodes[3].childNodes[1].addEventListener("keyup", setTaskName);
	cont.childNodes[3].childNodes[1].addEventListener("click", focusTask);
	document.getElementById("tasksCont").appendChild(cont);
	cont.childNodes[3].childNodes[1].focus();
	var taskCont = document.getElementsByClassName("taskCont");
	for (var i = 0; i < taskCont.length; i++) {
		taskCont[i].removeAttribute("style");
	}
	cont.style.border = "0.5px solid #8c9eff";
	cont.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1.5px 5px 0 rgba(0, 0, 0, 0.19)";
	document.getElementById("taskMenu").style.display = "none";
	clearMainTask();
}

// get input and listen for enter key to set name
var taskTimestamp;
var taskName;
function setTaskName() {
	var input = this;
	input.addEventListener("click", focusTask);
	var parent = this.parentElement;
	var name = document.createElement("p");
	name.classList.add("animated") + name.classList.add("fadeIn");
	name.style.marginBottom = "0";
	name.style.wordBreak = "break-all";
	name.innerHTML = input.value.capitalizeFirstLetter();

	// main task container
	document.getElementById("taskNameMain").innerHTML = name.innerHTML;
	var taskCont = document.getElementsByClassName("taskCont");
	for (var i = 0; i < taskCont.length; i++) {
		taskCont[i].removeAttribute("style");
	}
	parent.parentElement.style.border = "0.5px solid #8c9eff";
	parent.parentElement.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1.5px 5px 0 rgba(0, 0, 0, 0.19)";

	// get enter key
	if (event.which == 13 || event.keyCode == 13) {
		if (input.value.length > 1) {
			input.remove();
			parent.parentElement.addEventListener("click", openTask);
        	parent.appendChild(name);
        	taskTimestamp = new Date().getTime();
        	parent.parentElement.id = "mission-task-" + taskTimestamp;
        	parent.parentElement.click();
        	taskName = input.value.capitalizeFirstLetter();
        	newTask();
        	saveTask();
        	return false;
		}
    }
    return true;
}

// focus task and show style
function focusTask() {
	var taskCont = document.getElementsByClassName("taskCont");
	for (var i = 0; i < taskCont.length; i++) {
		taskCont[i].removeAttribute("style");
	}
	this.parentElement.parentElement.style.border = "0.5px solid #8c9eff";
	this.parentElement.parentElement.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1.5px 5px 0 rgba(0, 0, 0, 0.19)";
}

// save task
function saveTask() {
	// get timestamp
	var now = new Date(); 
	var month = now.getMonth()+1; 
	var day = now.getDate();
	var hour = now.getHours();
	var minute = now.getMinutes();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   
	if (hour.toString().length == 1) {
		var hour = '0' + hour;
	}
	if (minute.toString().length == 1) {
		var minute = '0' + minute;
	}

	var dateTime = day + '.' + month + ' ' + hour + ':' + minute;

	// main team mission ref
	var missionRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskTimestamp);
	missionRef.update({
		creator: uidKey,
		status: "Incomplete",
		task_name: taskName,
		created: dateTime
	});

	// shared with team mission ref
	var missionSharedWithRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskTimestamp);
	missionSharedWithRef.update({
		creator: uidKey,
		status: "Incomplete",
		task_name: taskName,
		created: dateTime
	});

	// display message
	snackbar.innerHTML = "Task added!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
}

// open a task in main window
var taskID;
var taskImg;
var taskDueDate;
function openTask() {
	clearMainTask();
	document.getElementById("taskMenu").style.display = "none";
	taskID = this.id.split("-")[2];
	taskImg = this.childNodes[5].childNodes[0];
	var icon = document.getElementById("checkTaskCompletedMain").childNodes[0];
	var statusColor = document.getElementById("mission-task-" + taskID).childNodes[1].childNodes[0].childNodes[0].style.stroke;
	icon.style.stroke = statusColor;
	var taskCont = document.getElementsByClassName("taskCont");
	for (var i = 0; i < taskCont.length; i++) {
		taskCont[i].removeAttribute("style");
	}
	this.style.border = "0.5px solid #8c9eff";
	this.style.boxShadow = "0 1px 2px 0 rgba(0, 0, 0, 0.2), 0 1.5px 5px 0 rgba(0, 0, 0, 0.19)";

	// due date
	var taskDueDateRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/due_date");
	taskDueDateRef.once("value", function(snapshot) {
		if (snapshot.val() != null) {
			// get data
			var time = snapshot.val().time;
			taskDueDate = snapshot.val().date;
			// replace - with /
			var date = snapshot.val().date;
			date = date.replace(/-/g, "<span class='dueDateSlash'>/</span>");
			
			// display in DOM
			document.getElementById("dueDate").innerHTML = date + " <span id='dueDateTime'>" + time + "</span>";
			document.getElementById("dueDate").style.color = "#8c9eff";
			document.getElementsByClassName("taskDueDateIcon")[0].style.border = "1px solid #8c9eff";
			document.getElementsByClassName("taskDueDateIcon")[0].childNodes[0].style.stroke = "#8c9eff";
		}

		else {
			document.getElementById("dueDate").innerHTML = "Due Date";
			document.getElementById("dueDate").style.color = "#9e9e9e";
			document.getElementsByClassName("taskDueDateIcon")[0].style.border = "1px solid #9e9e9e";
			document.getElementsByClassName("taskDueDateIcon")[0].childNodes[0].style.stroke = "#9e9e9e";
		}
	});

	// activity ref
	var activityCont = document.getElementById("missionTaskActivity");
	activityCont.innerHTML = "";
	var taskActivityRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity");
	taskActivityRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			var activity = document.createElement("p");
			// displat activityies
			var assignerRef = firebase.database().ref("accounts/" + child.val().commiter);
			assignerRef.once("value", function(snapshot) {
				// display activity
				activity.classList.add("taskActivity") + activity.classList.add("animated") + activity.classList.add("fadeIn");
				activity.innerHTML = "<span class='taskActivityCreator'>" + document.getElementById("masterMapIcon").innerHTML + " " + snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() + "</span> " + child.val().activity + "<span class='taskActivityDate'>" + document.getElementById("masterTimeIcon").innerHTML + " " + child.val().timestamp + "</span>"; 
				activityCont.appendChild(activity);
			});
		});
		// set created time and info in activity
		var missionTasksRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID);
		missionTasksRef.once("value", function(snapshot) {
			// set task data
			createdDate = snapshot.val().created;
			document.getElementById("taskNameMain").innerHTML = snapshot.val().task_name;
			var userRef = firebase.database().ref("accounts/" + snapshot.val().creator);
			userRef.once("value", function(snapshot) {
				var activity = document.createElement("p");
				activity.classList.add("taskActivity") + activity.classList.add("animated") + activity.classList.add("fadeIn");
				activity.innerHTML = "<span class='taskActivityCreator'>" + document.getElementById("masterMapIcon").innerHTML + " " + snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() + "</span> created task " + "<span class='taskActivityDate'>" + document.getElementById("masterTimeIcon").innerHTML + " " + createdDate + "</span>"; 
				// clear acitivtys before appending
				activityCont.appendChild(activity);
			});
			document.getElementById("missionTasksActivityTrigger").click();
		});
	});

	// set member task is assigned to
	var missionTasksAssignedRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/assigned");
	missionTasksAssignedRef.once("value", function(snapshot) {
		// set img src to be avatar url
		if (snapshot.val() != null) {
			accRef = firebase.database().ref("accounts/" + snapshot.val().assigned_to);
			accRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					document.getElementById("assignedAvatar").src = snapshot.val().Avatar_url;
					taskImg.src = snapshot.val().Avatar_url;
				}

				else {
					document.getElementById("assignedAvatar").src = "/img/avatar.png";
					taskImg.src = "/img/avatar.png";
				}

				document.getElementById("assignedName").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
				document.getElementById("assignedName").style.color = "#8c9eff";
				document.getElementById("assignedAvatar").classList.add("assignedAvatar");
				document.getElementById("taskMenu").style.display = "inline-flex";
			});
		}

		else {
			document.getElementById("assignedName").innerHTML = "Unassigned";
			document.getElementById("assignedName").style.color = "#9e9e9e";
			document.getElementById("assignedAvatar").src = "/img/unassigned.png";
			document.getElementById("assignedAvatar").classList.remove("assignedAvatar");
			document.getElementById("taskMenu").style.display = "inline-flex";
		}
	});
}

// display members to set a task
function unassignedTask() {
	// clear and reset
	$('#assignTaskCont').bind('click', function (e) { e.stopPropagation() });
	document.getElementById("unassignedTaskCont").innerHTML = "";
	// create avatars for members
	var membersRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/members");
	membersRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			var userRef = firebase.database().ref("accounts/" + child.key);
			userRef.once("value", function(snapshot) {
				var cont = document.createElement("div");
				cont.id = "unassignedTaskMember-" + child.val();
				cont.classList.add("col-lg-12") + cont.classList.add("dropdown-item") + cont.classList.add("newTeamMemberOption") + cont.classList.add("taskAssignToOption");
				cont.addEventListener("click", selectTaskAssign);

				var avatarCont = document.createElement("div");
				avatarCont.classList.add("col-lg-3") + avatarCont.classList.add("addTeamMembersAvatarCont");
				var avatarImg = document.createElement("img");
				avatarImg.classList.add("addTeamMemberAvatar");
				avatarImg.src = snapshot.val().Avatar_url;
				avatarCont.appendChild(avatarImg);

				var nameCont = document.createElement("div");
				nameCont.classList.add("col-lg-9");
				var name = document.createElement("p");
				name.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
				nameCont.appendChild(name);

				cont.appendChild(avatarCont);
				cont.appendChild(nameCont);
				document.getElementById("unassignedTaskCont").appendChild(cont);
			});
		});
	});
}

// select task assigner
var selectedTaskAssign = [];
function selectTaskAssign() {
	selectedTaskAssign = [];
	var options = document.getElementsByClassName("taskAssignToOption");
	for (var i = 0; i < options.length; i++) {
		options[i].classList.remove("animated") + options[i].classList.remove("fadeIn");
		options[i].childNodes[1].childNodes[0].classList.remove("selectedNewTeamMember");
	}

	this.classList.add("animated") + this.classList.add("fadeIn");
	this.childNodes[1].childNodes[0].classList.add("selectedNewTeamMember");
	selectedTaskAssign.push(this.id.split("-")[1]);
	console.log(selectedTaskAssign);
	document.getElementById("assignTaskBtn").style.border ="none";
	document.getElementById("assignTaskBtn").classList.add("addTaskAssignBtnConfirm");
	document.getElementById("assignTaskBtn").classList.add("fadeIn");
	document.getElementById("assignTaskBtn").addEventListener("click", confirmTaskAssign);
}


// assign task to selected member
function confirmTaskAssign() {
	// main ref
	var taskRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/assigned");
	taskRef.update({
		assigned_to: selectedTaskAssign[0]
	});

	// shared with ref
	var taskSharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/assigned");
	taskSharedRef.update({
		assigned_to: selectedTaskAssign[0]
	});

	var accRef = firebase.database().ref("accounts/" + selectedTaskAssign[0]);
	accRef.once("value", function(snapshot) {
		if (snapshot.val().Avatar_url != undefined) {
			document.getElementById("assignedAvatar").src = snapshot.val().Avatar_url;
			taskImg.src = snapshot.val().Avatar_url;
		}

		else {
			document.getElementById("assignedAvatar").src = "/img/avatar.png";
			taskImg.src = "/img/avatar.png";
		}

		document.getElementById("assignedName").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		document.getElementById("assignedName").style.color = "#8c9eff";
		document.getElementById("assignedAvatar").classList.add("assignedAvatar");

		// display message
		snackbar.innerHTML = "Task succesfully assigned to " + snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() +  "!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

		// get time stamp
		var now = new Date(); 
		var month = now.getMonth()+1; 
		var day = now.getDate();
		var hour = now.getHours();
		var minute = now.getMinutes();

		// add zeros if needed
		if (month.toString().length == 1) {
			var month = '0' + month;
		}
		if (day.toString().length == 1) {
			var day = '0' + day;
		}   
		if (hour.toString().length == 1) {
			var hour = '0' + hour;
		}
		if (minute.toString().length == 1) {
			var minute = '0' + minute;
		}

		var dateTime = day + '.' + month + ' ' + hour + ':' + minute;

		// activity ref
		var taskActivityRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity/" + now.getTime());
		var taskActivitySharedRef = firebase.database().ref("projects/" + projectId + "/teams/" + missionSharedWith + "/missions/" + category + "/" + missionID + "/tasks/" + taskID + "/activity/" + now.getTime());

		taskActivityRef.update({
			commiter: uidKey,
			activity: "assigned task",
			target: selectedTaskAssign[0],
			timestamp: dateTime
		});
		taskActivitySharedRef.update({
			commiter: uidKey,
			activity: "assigned task",
			target: selectedTaskAssign[0],
			timestamp: dateTime
		});

		var assignerRef = firebase.database().ref("accounts/" + uidKey);
		assignerRef.once("value", function(snapshot) {
			// display activity
			var newAcitivty = document.createElement("p");
			newAcitivty.classList.add("taskActivity") + newAcitivty.classList.add("animated") + newAcitivty.classList.add("fadeIn");
			newAcitivty.innerHTML = "<span class='taskActivityCreator'>" + document.getElementById("masterMapIcon").innerHTML + " " + snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter() + "</span> assigned task" + "<span class='taskActivityDate'>" + document.getElementById("masterTimeIcon").innerHTML + " " + dateTime + "</span>"; 
			document.getElementById("missionTaskActivity").insertBefore(newAcitivty, document.getElementById("missionTaskActivity").childNodes[0]);
		});

		// reset
		selectedTaskAssign = [];
	});

	// reset after setting
	document.getElementById("assignTaskBtn").style.border ="0.5px solid #eeeeee";
	document.getElementById("assignTaskBtn").classList.remove("addTaskAssignBtnConfirm");
	document.getElementById("assignTaskBtn").classList.remove("fadeIn");
	document.getElementById("assignTaskBtn").removeEventListener("click", confirmTaskAssign);
	var options = document.getElementsByClassName("taskAssignToOption");
	for (var i = 0; i < options.length; i++) {
		options[i].classList.remove("animated") + options[i].classList.remove("fadeIn");
		options[i].childNodes[1].childNodes[0].classList.remove("selectedNewTeamMember");
	}
	document.getElementById("mainTaskCont").click();
}

// resets main task container
function clearMainTask() {
	document.getElementById("taskNameMain").innerHTML = "";
}

// open new mission modal and form
function newMission() {
	// open modal
	$('#newMissionModal').modal('show');

	// clear and reset
	document.getElementById("shareWithTeam").innerHTML = "";

	// fill privacy options with current teams in project
	var count = 0;
	var projectRef = firebase.database().ref("projects/" + projectId + "/teams/");
	projectRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			// dont include current team
			if (child.val().name != teamName) {
				count++;
				// display first team as standard and value
				if (count === 1) {
					document.getElementById("public").value = child.val().name.toLowerCase();
					document.getElementById("dropdownTeams").innerHTML = child.val().name.capitalizeFirstLetter() + " (Public to the team)";
				}
				// create list element
				var teamOption = document.createElement("p");
				teamOption.classList.add("dropdown-item") + teamOption.classList.add("teamOption");
				teamOption.innerHTML = child.val().name.capitalizeFirstLetter();
				teamOption.addEventListener("click", selectTeamOption);
				document.getElementById("shareWithTeam").appendChild(teamOption);
			}
		});
	});

	// init create mission event
	document.getElementById("createMission").addEventListener("click", createNewMission);
}

// select team to share mission with
var missionSharedWith;
var checked = false;
function selectTeamOption() {
	// set innerHTML
	document.getElementById("dropdownTeams").innerHTML = this.innerHTML + " (Public to the team)";
	missionSharedWith = this.innerHTML.toLowerCase();
	document.getElementById("public").value = missionSharedWith;
}

// create new mission
function createNewMission() {
	// get values
	var missionName = document.getElementById("newMissionName");
	var missionDescription = document.getElementById("newMissionDesc");

	// run checks
	if (missionName.value.length === 0) {
		document.getElementById("missionNameError").innerHTML = "Please enter a mission name!";
		return;
	}

	else {
		document.getElementById("missionNameError").innerHTML = "";

	}

	if (missionDescription.value.length === 0) {
		document.getElementById("missionDescError").innerHTML = "Please enter a description for the mission!";
		return;
	}

	else {
		document.getElementById("missionDescError").innerHTML = "";
	}

	// get checked radio button
	var privacy;
	document.getElementById("missionOptionError").innerHTML = "Please select a privacy option for the mission!";
	var radio = document.getElementsByClassName("form-check-input");
	for (var i = 0; i < radio.length; i++) {
		if (radio[i].checked === true) {
			privacy = radio[i].value;
			checked = true;
			document.getElementById("missionOptionError").innerHTML = "";
		}
	}

	console.log(checked);
	if (checked === false) {
		return;
	}

	// create team
	else {
		// private
		if (privacy === "private") {
			var teamRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/private/" + new Date().getTime());
			teamRef.update({
				mission_name: missionName.value,
				mission_description: missionDescription.value,
				privacy: privacy,
				mission_admin: uidKey
			});
		}
		// public
		else {
			var timestamp = new Date().getTime();
			var teamRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/public/" + timestamp);
			teamRef.update({
				mission_name: missionName.value,
				mission_description: missionDescription.value,
				privacy: public,
				shared_with: privacy,
				main_team: teamName,
				mission_admin: uidKey
			});

			// sharedw with ref
			var teamRef = firebase.database().ref("projects/" + projectId + "/teams/" + privacy + "/missions/public/" + timestamp);
			teamRef.update({
				mission_name: missionName.value,
				mission_description: missionDescription.value,
				privacy: public,
				shared_with: teamName,
				main_team: teamName,
				mission_admin: uidKey
			});
		}
		// close modal
		$('#newMissionModal').modal('hide');
		// reset values
		missionName.value = "";
		missionDescription.value = "";
		for (var i = 0; i < radio.length; i++) {
			if (radio[i].checked === true) {
				radio[i].checked = false;
			}
		}

		// display message
		snackbar.innerHTML = "Mission succesfully created!";
		snackbar.className = "show";
		setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
	}
}










// load mission data and insert into calendar
function loadCalendarData() {
	// load data into calendar
	var taskRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks")
	taskRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			console.log(child.key);
			var taskDueDateRef = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + child.key + "/due_date");
			taskDueDateRef.once("value", function(snapshot) {
				if (snapshot.val() != null) {
					var dateID = document.getElementById(snapshot.val().date);
					if (dateID != undefined || dateID != null) {
						var cont = document.createElement("div");
						cont.id = "calendarTask-" + child.key;
						cont.classList.add("row") + cont.classList.add("col-lg-12") + cont.classList.add("calendarEvent");
						var calendarTask = document.createElement("p");
						calendarTask.classList.add("calendarTask");
						cont.appendChild(calendarTask);
						cont.setAttribute("draggable", true);
						cont.addEventListener("dragstart", drag);
						dateID.appendChild(cont);

						var task = firebase.database().ref("projects/" + projectId + "/teams/" + teamName + "/missions/" + category + "/" + missionID + "/tasks/" + child.key);
						task.once("value", function(snapshot) {
							calendarTask.innerHTML = snapshot.val().task_name;
						});
					}
				}
			});
		});
	});
}

// create and open calender for selected team
var today;
var currentMonth;
var currentYear;
var currentDate;
var navigationCount = 0;
const monthNames = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];
function calendar() {
	// init events
	document.getElementById("nextMonth").addEventListener("click", nextMonth);
	document.getElementById("prevMonth").addEventListener("click", prevMonth);


	var getYear = new Date().getFullYear();
	var getMonth = new Date().getMonth();
	currentMonth = getMonth;
	currentYear = getYear;
	for (var i = 0; i < 12; i++) {
		//console.log(new Date(getYear, i, 0).getDate());
	}

	// week days
	var date = new Date();
	var weekday = new Array(7);
	weekday[0] =  "Sunday";
	weekday[1] = "Monday";
	weekday[2] = "Tuesday";
	weekday[3] = "Wednesday";
	weekday[4] = "Thursday";
	weekday[5] = "Friday";
	weekday[6] = "Saturday";

	var dayName = weekday[date.getDay()];
	today = new Date().getDate();
	document.getElementById("today").innerHTML = dayName;
	document.getElementById("todayDate").innerHTML = today;

	// displays current year and month
	document.getElementById("monthAndYear").innerHTML = monthNames[currentMonth] + " " + currentYear;

	// get current month days
	var getMonthDays = new Date(getYear, getMonth, 0).getDate();
	currentDate = getMonthDays;
	var count = 0;

	// create elements after amount of month days
	for (var i = 1; i < getMonthDays; i++) {
		count++;
		var day = document.createElement("div");
		day.addEventListener("click", selectDate);
		day.id = i + "-" + (currentMonth + 1) + "-" + currentYear;
		day.classList.add("col-lg-1") + day.classList.add("text-center") + day.classList.add("animated") + day.classList.add("fadeIn");

		// style days depending on prev / after today
		if (i < today) {
			day.classList.add("oldCalendarDay");
		}

		else if (i >= today) {
			day.classList.add("calendarDay");
			day.addEventListener("drop", drop);
			day.addEventListener("dragover", allowDrop);
		}

		var dayNr = document.createElement("p");
		dayNr.classList.add("dayNr");
		dayNr.innerHTML = i;
		day.appendChild(dayNr);
		document.getElementById("calendarMain").appendChild(day);

		if (count === 7) {
			var breakWeek = document.createElement("div");
			breakWeek.classList.add("w-100");
			document.getElementById("calendarMain").appendChild(breakWeek);
			count = 0;
		}
	}

	loadCalendarData();
}

// drop task calendar functions
function allowDrop(e) {
	e.preventDefault();
}

function drag(e) {
	e.dataTransfer.setData("text", e.target.id);
}

function drop(e) {
	e.preventDefault();
    var data = e.dataTransfer.getData("text");
    //console.log(data);
    console.log(e.target);
    e.target.appendChild(document.getElementById(data));

    // style
	if (document.getElementsByClassName("calendarActive")[0] != undefined) {
		document.getElementsByClassName("calendarActive")[0].classList.remove("calendarActive");
	}
	e.target.classList.add("calendarActive");
}

// display next month
var month;
var year;
var notCurrentYear = true;
var yearCount = 0;
function nextMonth() {
	navigationCount++;

	// get year and month
	if (notCurrentYear === true) {
		month = currentMonth + (navigationCount - 1);
		notCurrentYear = false;
	}

	if (month === 11) {
		month = 0;
		navigationCount = 0;
		yearCount++;
	}

	else {
		month++;
	}

	year = currentYear + yearCount;

	// reset and clear
	document.getElementById("calendarMain").innerHTML = "";

	// get amount of days in month
	var getMonthDays = new Date(year, month + 1, 0).getDate();
	var count = 0;

	// displays current year and month
	document.getElementById("monthAndYear").innerHTML = monthNames[month] + " " + year;

	// create elements after amount of month days
	for (var i = 1; i < getMonthDays + 1; i++) {
		count++;
		var day = document.createElement("div");
		day.addEventListener("click", selectDate);
		day.id = i + "-" + (month + 1) + "-" + currentYear;
		day.classList.add("col-lg-1") + day.classList.add("text-center") + day.classList.add("animated") + day.classList.add("fadeIn");
		var dayNr = document.createElement("p");
		dayNr.classList.add("dayNr");
		dayNr.innerHTML = i;
		day.appendChild(dayNr);

		// check if current month navigated to is current month
		if (i < today && month === currentMonth && year === currentYear) {
			day.classList.add("oldCalendarDay");
		}

		else if (i >= today && month === currentMonth && year === currentYear) {
			day.classList.add("calendarDay");
		}

		else if (month < currentMonth && year === currentYear) {
			day.classList.add("oldCalendarDay");
		}

		else {
			day.classList.add("calendarDay");
		}

		// append to DOM
		document.getElementById("calendarMain").appendChild(day);

		// break line into rows for every week
		if (count === 7) {
			var breakWeek = document.createElement("div");
			breakWeek.classList.add("w-100");
			document.getElementById("calendarMain").appendChild(breakWeek);
			count = 0;
		}
	}

	// load calendar data
	loadCalendarData();
}

// display previous month
function prevMonth() {
	navigationCount--;

	// get year and month
	if (notCurrentYear === true) {
		month = currentMonth - (navigationCount + 1);
		notCurrentYear = false;
	}

	if (month === 0) {
		month = 11;
		navigationCount = 0;
		yearCount--;
	}

	else {
		month--;
	}

	year = currentYear + yearCount;

	document.getElementById("monthAndYear").innerHTML = monthNames[month] + " " + year;

	// reset and clear
	document.getElementById("calendarMain").innerHTML = "";
	var getMonthDays = new Date(year, month + 1, 0).getDate();
	var count = 0;

	// create elements after amount of month days
	for (var i = 1; i < getMonthDays + 1; i++) {
		count++;
		var day = document.createElement("div");
		day.addEventListener("click", selectDate);
		day.id = i + "-" + (month + 1) + "-" + currentYear;
		day.classList.add("col-lg-1") + day.classList.add("text-center") + day.classList.add("animated") + day.classList.add("fadeIn");
		var dayNr = document.createElement("p");
		dayNr.classList.add("dayNr");
		dayNr.innerHTML = i;
		day.appendChild(dayNr);

		// check if current month navigated to is current month
		if (i < today && month === currentMonth && year === currentYear) {
			day.classList.add("oldCalendarDay");
		}

		else if (i >= today && month === currentMonth && year === currentYear) {
			day.classList.add("calendarDay");
		}

		else if (month > currentMonth && year === currentYear) {
			day.classList.add("calendarDay");
		}

		else {
			day.classList.add("oldCalendarDay");
		}

		// append to DOM
		document.getElementById("calendarMain").appendChild(day);

		// break line into rows for every week
		if (count === 7) {
			var breakWeek = document.createElement("div");
			breakWeek.classList.add("w-100");
			document.getElementById("calendarMain").appendChild(breakWeek);
			count = 0;
		}
	}

	loadCalendarData();
}

// select date
function selectDate() {
	// format date to get the day
	if (document.getElementsByClassName("calendarActive")[0] != undefined) {
		document.getElementsByClassName("calendarActive")[0].classList.remove("calendarActive");
	}
	this.classList.add("calendarActive");
	var str = this.id;
	if (this.classList.contains("oldCalendarDayDueDate") || this.classList.contains("calendarDayDueDate")) {
		var formatDate = str.replace(/-/g, "/");
    	var formatedDay = formatDate.split("/")[1];
    	var formatedMonth = formatDate.split("/")[2];
	}

	else {
		var formatDate = str.replace(/-/g, "/");
    	var formatedDay = formatDate.split("/")[0];
    	var formatedMonth = formatDate.split("/")[1];
	}
    
	if (formatedMonth.length == 1) {
		formatedMonth = '0' + formatedMonth;
	}

	if (formatedDay.length == 1) {
		formatedDay = '0' + formatedDay;
	}

	var year;
	document.getElementById("setDueDate").style.opacity = "1";
	if (this.classList.contains("oldCalendarDayDueDate") || this.classList.contains("calendarDayDueDate")) {
		formatDate = formatDate.split("/")[3] + "/" + formatedMonth + "/" + formatedDay;
		year = formatDate.split("/")[3];
	}

	else {
		formatDate = formatDate.split("/")[2] + "/" + formatedMonth + "/" + formatedDay;
	}

	if (this.classList.contains("calendarDayDueDate")) {
		document.getElementById("setDueDate").addEventListener("click", setDueDate);
		document.getElementById("setDueDate").style.opacity = "1";
	}

	else {
		document.getElementById("setDueDate").removeEventListener("click", setDueDate);
		document.getElementById("setDueDate").style.opacity = "0.3";
	}

	// get selected dates name
	function getDayOfWeek(date) {
  		var dayOfWeek = new Date(date).getDay();    
  		return isNaN(dayOfWeek) ? null : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];
	}

	// display selected date
	document.getElementById("today").innerHTML = getDayOfWeek(formatDate);
	document.getElementById("todayDate").innerHTML = this.childNodes[0].innerHTML;
	document.getElementById("selectedDate").innerHTML = getDayOfWeek(formatDate);
	document.getElementById("selectedDateInfo").innerHTML = this.innerHTML + " " + monthAndYearDueDate.innerHTML.split(" ")[0];
	document.getElementById("selectedDate").classList.add("fadeIn");
	document.getElementById("selectedDateInfo").classList.add("fadeIn");
	selectedDueDate = this;
}









// return to project overview
function backToProject() {

	// hide team container
	document.getElementById("teamMain").style.display = "none";

	// show project container
	document.getElementById("projectMain").style.display = "block";
}

function backToTeam() {
	backToTeamBool = true;
	enterTeam();
}

// create a new team
var topics = document.getElementsByClassName("teamCard");
function openNewTeam() {
	// show new team modal
	$('#newTeamModal').modal('show');

	// get topics
	for (var i = 0; i < topics.length; i++) {
		topics[i].addEventListener("click", selectTopic);
	}
}

// select team topic and style
var selectedTopic;
var selectedTopicColor;
function selectTopic() {
	for (var i = 0; i < topics.length; i++) {
		topics[i].style.transition = "all 0.4s";
		topics[i].style.opacity = "0.5";
		topics[i].style.transform = "scale(0.5)";
	}
	this.style.opacity = "1";
	this.style.transform = "scale(1)";
	selectedTopic = this.id;

	// enable add members function
	document.getElementById("selectTeamMembers").style.display = "block";
	document.getElementById("selectTeamMembers").addEventListener("click", displayAvailableTeamMembers);
}

// displays available team members
function displayAvailableTeamMembers() {
	this.classList.remove("fadeInDown");
	this.classList.add("bounceOutRight");
	document.getElementById("selectedTopicCont").classList.add("fadeOut");
	var arrow = this;

	// load friends available to join team
	var friendsRef = firebase.database().ref("accounts/" + uidKey + "/friends");
	friendsRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			
			// create friend container
			var cont = document.createElement("div");
			cont.id = "profile-" + child.key;
			cont.classList.add("col") + cont.classList.add("col-lg-4") + cont.classList.add("newProjectFriendsCont") + cont.classList.add("fadeIn") + cont.classList.add("fadeIn") + cont.classList.add("profile-" + child.key);

			// create avatar img
			var friendImg = document.createElement("img");
			friendImg.classList.add("newProjectFriendAvatar");

			// add select friend for project event
			friendImg.addEventListener("click", selectTeamMember);

			// set img src to be avatar url
			friendRef = firebase.database().ref("accounts/" + child.key);
			friendRef.once("value", function(snapshot) {
				if (snapshot.val().Avatar_url != undefined) {
					friendImg.src = snapshot.val().Avatar_url;
				}

				else {
					friendImg.src = "/img/avatar.png";
				}
			});

			// create friend name
			var friendName = document.createElement("h5");
			friendName.classList.add("friendsName") + friendName.classList.add("text-center");
			friendName.innerHTML = child.val().First_Name.capitalizeFirstLetter() + " " + child.val().Last_Name.capitalizeFirstLetter();

			// create friend email
			var friendEmail = document.createElement("p");
			friendEmail.classList.add("friendsEmail") + friendEmail.classList.add("text-center");
			friendEmail.innerHTML = child.val().Email;

			// append
			cont.appendChild(friendImg);
			cont.appendChild(friendName);
			cont.appendChild(friendEmail);

			// display
			document.getElementById("newTeamMembers").appendChild(cont);
  		});
  		arrow.style.display = "none";
  		document.getElementById("selectedTopicCont").style.display = "none";
		document.getElementById("newTeamMembers").style.opacity = "1";
		document.getElementById("newTeamMembers").style.paddingBottom = "15vh";

		document.getElementById("newTeamIntro").innerHTML = "Select members to join <br><span id='selectedTopic'>" + selectedTopic.capitalizeFirstLetter() + "</span>";
		document.getElementById("selectedTopic").style.fontSize = "32.5px";
		document.getElementById("selectedTopic").style.color = "#8c9eff";
	});
}

// select members to join the team
function selectTeamMember() {
	// check class
	if (this.classList.contains("selectedTeamMember")) {
		this.classList.remove("selectedTeamMember");
		this.parentElement.childNodes[1].classList.remove("selectedTeamMemberInfo");
		this.parentElement.childNodes[2].classList.remove("selectedTeamMemberInfo");
	}

	else {
		this.classList.add("selectedTeamMember");
		this.parentElement.childNodes[1].classList.add("selectedTeamMemberInfo");
		this.parentElement.childNodes[2].classList.add("selectedTeamMemberInfo");
	}

	// style button and add event if true
	var selectedTeamMembers = document.getElementsByClassName("selectedTeamMember");
	var createTeamBtn = document.getElementById("createTeam");
	if (selectedTeamMembers.length >= 1) {
		createTeamBtn.style.border = "0.5px solid #8c9eff";
		createTeamBtn.style.backgroundColor = "#8c9eff";
		createTeamBtn.style.color = "white";
		createTeamBtn.classList.remove("disabled");
		createTeamBtn.classList.add("box");

		// init event
		createTeamBtn.addEventListener("click", createTeam);
	}

	else {
		createTeamBtn.style.border = "0.5px solid #9e9e9e";
		createTeamBtn.style.backgroundColor = "white";
		createTeamBtn.style.color = "#9e9e9e";
		createTeamBtn.classList.add("disabled");
		createTeamBtn.classList.remove("box");
		createTeamBtn.removeEventListener("click", createTeam);
	}
}

// create the selected team and store it with members
function createTeam() {
	// array for members
	var members = [];
	members.push(uidKey);
		
	// get selected members to join team
	var selected = document.getElementsByClassName("selectedTeamMember");
	for (var i = 0; i < selected.length; i++) {
		var key = selected[i].parentElement.id.split("-")[1];
		members.push(key);
	}

	for (var i = 0; i < members.length; i++) {
		// set project to every member
		var memberRef = firebase.database().ref("accounts/" + members[i] + "/projects/" + projectId + "/teams/" + selectedTopic);
		memberRef.update({
			name: selectedTopic,
			members: members
		});
	}

	// set team creator
	var leaderRef = firebase.database().ref("accounts/" + uidKey + "/projects/" + projectId + "/teams/" + selectedTopic);
	leaderRef.update({
		name: selectedTopic,
		members: members
	});

	// create team and store data
	var projectRef = firebase.database().ref("projects/" + projectId + "/teams/" + selectedTopic);
	projectRef.update({
		name: selectedTopic,
		members: members
	});

	// close modal
	$('#newTeamModal').modal('hide');

	// display message
	snackbar.innerHTML = selectedTopic.capitalizeFirstLetter() + " succesfully created!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);
	document.getElementById("newTeamMembers").style.paddingBottom = "0vh";
}

// reset the new team modal
function resetNewTeam() {
	var createTeamBtn = document.getElementById("createTeam");
	createTeamBtn.style.border = "0.5px solid #9e9e9e";
	createTeamBtn.style.backgroundColor = "white";
	createTeamBtn.style.color = "#9e9e9e";
	createTeamBtn.classList.add("disabled");
	createTeamBtn.classList.remove("box");

	createTeamBtn.removeEventListener("click", createTeam);
	for (var i = 0; i < topics.length; i++) {
		topics[i].style.opacity = "1";
		topics[i].style.transform = "scale(1)";
	}

	document.getElementById("selectTeamMembers").classList.remove("bounceOutRight");
	document.getElementById("selectedTopicCont").classList.remove("fadeOut");
	document.getElementById("selectedTopicCont").style.display = "inline-flex";
	document.getElementById("newTeamMembers").innerHTML = "";
	document.getElementById("newTeamIntro").innerHTML = "Select the teams topic";
}

// members for project
function members() {
	// reset 
	document.getElementById("membersAside").innerHTML = "";

	// get key
	selectedAvatar = uidKey;
	if (this.tagName === "IMG") {
		selectedAvatar = this.id.split("-")[1];
	}

	// load members
	var members = [];
	var projectMembersRef = firebase.database().ref("projects/" + selectedProject + "/members");
	projectMembersRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			members.push(child.val());
		});
		
		// create member avatars
		for (var i = 0; i < members.length; i++) {
			// set img src to be avatar url
			var memberRef = firebase.database().ref("accounts/" + members[i]);
			memberRef.once("value", function(snapshot) {
				var cont = document.createElement("div");
				cont.id = "projectmember-" + snapshot.key;
				cont.classList.add("media") + cont.classList.add("col-lg-12") + cont.classList.add("memberMedia");
				cont.addEventListener("click", selectMember);

				var img = document.createElement("img");
				img.classList.add("memberAvatar") + img.classList.add("mr-3");

				if (snapshot.val().Avatar_url != undefined) {
					img.src = snapshot.val().Avatar_url;
				}

				else {
					img.src = "/img/avatar.png";
				}

				img.id = "projmember-" + snapshot.key;

				var body = document.createElement("div");
				body.classList.add("media-body");

				var name = document.createElement("h5");
				name.classList.add("memberName") + name.classList.add("mt-0");
				name.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();

				// get role
				var role = document.createElement("p");
				var projectRoleRef = firebase.database().ref("projects/" + selectedProject + "/roles/" + snapshot.key + "/role");
				projectRoleRef.once("value", function(snapshot) {
					role.innerHTML = snapshot.val().split(" ")[0].capitalizeFirstLetter() + " " + snapshot.val().split(" ")[1].capitalizeFirstLetter();
				});

				cont.appendChild(img);
				body.appendChild(name);
				body.appendChild(role);
				cont.appendChild(body);

				document.getElementById("membersAside").appendChild(cont);
				// run to open logged inn account
				selectMember();
			});
		}
	});
}

// arrays with role jobs
var job;
var manager_Roles = ["Participates in and approves project plan and deliverables", 
	"Manages, reviews, and prioritizes the project work plans with objective to stay on time and on budget",
	"Manages project resources",
	"Identifies required project team members and constructs project teams",
	"Motivates and coaches project managers* and team members"];

var leader_Roles = ["Assigned full or part time to participate in project team activities",
	"Responsible for contributing to overall project objectives and specific team deliverables",
	"Manages specific project plan activities and contributes to project plan development in collaboration with project manager",
	"Coordinates documentation, testing, and training efforts related to project plan"];

var member_Roles = ["Assigned full or part time to participate in project team activities",
	"Responsible for contributing to overall project objectives and specific team deliverables",
	"Escalates policy issues to team lead for referral to appropriate policy making bodies",
	"This role includes all various resources necessary to execute the project plan"];

var sponsor_Roles = ["Makes the business decisions for the program/project",
	"Participates day-to-day in one or more programs/projects",
	"Makes user resources available",
	"Approves work products",
	"Disposes of issues and project scope change requests"];

var support_Roles = ["This role is comprised of various team members who perform technology support for the project",
	"Membership includes DBA, App Admin, App Dev, Business Analyst, etc",
	"Establishes project support technology standards",
	"Assists team members in the use of project support technology",
	"Maintains project support technology",
	"Ensures that the technical environment is in place and operational throughout the project",
	"Establishes and maintains target environment for new applications"];

var user_Roles = ["Provides source information to the team",
	"Provides expert business understanding of the organization",
	"Represents the users area in identifying current or future procedures",
	"Reviews and confirms major SDLC work products for the project",
	"Participates as required in User Acceptance Testing Activities"];

var developer_Roles = ["Designs systems from a user perspective",
	"Designs human factors (windowing, ease-of-use)",
	"Designs externals (screens, reports, forms)",
	"Designs usability of the application",
	"Designs application software components, including programs, modules, and run units",
	"Prototypes, develops, and unit tests application software components or fragments",
	"Typically knowledgeable in one or more development environments",
	"Participates with Business Analysts in application documentation"];

var analyst_Roles = ["Assesses current systems",
	"Develops and maintains models of business requirements",
	"Designs business transactions",
	"Designs and organizes procedures",
	"Documents and analyzes business processes using value-added/non-value added, process modeling tools, cost-time charts, and root cause analysis or other tools as appropriate",
	"Documents “ability to” functional requirements for use by application designers and developers",
	"Is an active participant in unit testing, system testing, and regression testing"];

// display a selected project member
var selectedMemberKey;
function selectMember() {
	// init update role event and reset values on member change
	var select = document.getElementById("selectRole");
	select.value = "Choose";
	select.addEventListener("change", checkRole);
	checkRole();

	// set selected styling
	var membersConts = document.getElementsByClassName("memberMedia");
	for (var i = 0; i < membersConts.length; i++) {
		membersConts[i].classList.remove("activeMember");
	}

	//get key
	var key;
	if (this.tagName === "DIV") {
		key = this.id.split("-")[1];
		selectedMemberKey = this.id.split("-")[1];
		this.classList.add("activeMember");
	}

	else {
		key = uidKey;
		selectedMemberKey = uidKey;
		document.getElementById("projectmember-" + uidKey).classList.add("activeMember");
	}

	// init open profile link
	document.getElementsByClassName("selectedMemberHomepage")[0].id = "projectmemberlink-" + key;
	document.getElementsByClassName("selectedMemberHomepage")[0].addEventListener("click", openProfile);

	// get data
	var avatar = document.getElementById("selectedMemberAvatar");
	var name = document.getElementById("selectedMemberName");
	var mail = document.getElementById("selectedMemberMail");
	avatar.style.width = avatar.parentElement.offsetWidth + "px";
	avatar.style.height = avatar.parentElement.offsetWidth + "px";

	var memberRef = firebase.database().ref("accounts/" + key);
	memberRef.once("value", function(snapshot) {
		avatar.src = snapshot.val().Avatar_url;
		name.innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		mail.innerHTML = snapshot.val().Email;
		avatar.style.display = "block";
	});

	// get users role
	var projectRoleRef = firebase.database().ref("projects/" + selectedProject + "/roles/" + key + "/role");
	projectRoleRef.once("value", function(snapshot) {
		// check if a role is set
		if (snapshot.val() === null || snapshot.val() === undefined) {
			// set project member if no role
			var setRoleRef = firebase.database().ref("projects/" + selectedProject + "/roles/" + key);
			setRoleRef.update({
				role: "Project Member"
			});
			document.getElementById("projectRole").innerHTML = "Project Member";
		}

		else {
			// set role and role jobs
			job = snapshot.val().split(" ")[1].toLowerCase();
			document.getElementById("projectRole").innerHTML = snapshot.val().split(" ")[0].capitalizeFirstLetter() + " " + snapshot.val().split(" ")[1].capitalizeFirstLetter();
			displayJobs();
		}
		
		// disable role from update menu
		for (var i = 0; i < select.childNodes.length; i++) {
			if (select.childNodes[i].tagName === "OPTION") {
				if (select.childNodes[i].value === snapshot.val()) {
					select.childNodes[i].setAttribute("disabled", true);
				}

				else {
					select.childNodes[i].removeAttribute("disabled");
				}
			}
		}
		document.getElementById("currentRole").style.display = "block";
	});

	// responsive img / auto resize
	window.onresize = function(event) {
		avatar.style.width = avatar.parentElement.offsetWidth + "px";
		avatar.style.height = avatar.parentElement.offsetWidth + "px";
	};
}


function displayJobs() {
	// clear before appending
	document.getElementById("roleJobs").innerHTML = "";

	// get role job data
	var jobRoles = eval(job + "_Roles");
	for (var i = 0; i < jobRoles.length; i++) {
		var listEle = document.createElement("li");
		listEle.classList.add("list-group-item");
		listEle.innerHTML = jobRoles[i];
		document.getElementById("roleJobs").appendChild(listEle);
	}
	document.getElementById("roleInfo").addEventListener("click", roleInfo);
	return;
}

// check selected role
function checkRole() {
	var btn = document.getElementById("updateRoleBtn");
	if (document.getElementById("selectRole").value != "Choose") {
		btn.classList.add("updateRoleBtnOK");
		btn.classList.remove("disabled");
		btn.style.border = "1px solid #8c9eff"
		btn.style.backgroundColor = "#8c9eff";
		btn.style.color = "white";
		btn.style.opacity = "1";

		// init confirm role change event
		btn.addEventListener("click", updateRole);
		job = document.getElementById("selectRole").value.split(" ")[1].toLowerCase();
		displayJobs();
	}

	else {
		btn.classList.remove("updateRoleBtnOK");
		btn.classList.add("disabled");
		btn.style.border = "1px solid #9e9e9e";
		btn.style.backgroundColor = "white";
		btn.style.color = "#9e9e9e";
		btn.style.opacity = "0.5";

		// remove event listener
		btn.removeEventListener("click", updateRole);
		document.getElementById("roleJobs").style.display = "none";
	}
}

// show and hide role info list
function roleInfo() {
	console.log(123);
	var list = document.getElementById("roleJobs");
	if (list.style.display === "block") {
		list.style.display = "none";
	}

	else {
		list.style.display = "block";
	}
}

// update selected members project role
function updateRole() {
	// get value
	var value = document.getElementById("selectRole").value;

	// get ref
	var projectRoleRef = firebase.database().ref("projects/" + selectedProject + "/roles/" + selectedMemberKey);
	projectRoleRef.update({
		role: value
	});

	// update values
	document.getElementById("projectmember-" + selectedMemberKey).childNodes[1].childNodes[1].innerHTML = value;
	document.getElementById("projectRole").innerHTML = value;

	// display message
	snackbar.innerHTML = "Role succesfully updated!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

	// reset
	document.getElementById("selectRole").value = "Choose";
	checkRole();
}

// display reports and init reports event
function reports() {
	// init events
	document.getElementById("newPreReportCont").addEventListener("click", newPreReport);
}

// opens a new pre-report modal
function newPreReport() {
	// get data
	var projectRef = firebase.database().ref("projects/" + selectedProject);
	projectRef.once("value", function(snapshot) {
		document.getElementById("newPreReportName").innerHTML = snapshot.val().name.capitalizeFirstLetter();
		snapshot.forEach((child) => {

		});
	});

	// show pre report editor modal
	$('#newPreReportModal').modal('show');

	// make user editing status live 
	var preReportLiveRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/live/" + uidKey);
	preReportLiveRef.update({
		live: true
	});

	// display editor
	newPreReportEditor();

	// init exit editor event
	document.getElementById("exitPreReportModal").addEventListener("click", exitPreReport);
}

// prep toolbar and editor
function newPreReportEditor() {
	// init new editor if not present
	if (document.getElementsByClassName("ql-editor")[0] === undefined) {
		// check for live members
		checkLivePreReport();

		// editor toolbar
		var toolbarOptions = [
		  ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
		  ['blockquote', 'code-block'],

		  [{ 'header': 1 }, { 'header': 2 }],               // custom button values
		  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
		  [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
		  [{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
		  [{ 'direction': 'rtl' }],                         // text direction

		  [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
		  [{ 'header': [1, 2, 3, 4, 5, 6, false] }],

		  [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
		  [{ 'font': [] }],
		  [{ 'align': [] }],
		   [ 'link', 'image', 'video', 'formula' ],

		  ['clean']                                         // remove formatting button
		];

		var quill = new Quill('#newPreReportEditor', {
		  modules: {
		    toolbar: toolbarOptions
		  },
		  theme: 'snow'
		});

		// get report data and insert into editor
		var preReportListenRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/report/main");
		preReportListenRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				document.getElementsByClassName("ql-editor")[0].innerHTML = child.val();
			});
		});

		var liveUserRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/live");
		liveUserRef.on("child_changed", function(snapshot) {
			// remove bounce animation to prep for new
			var avatars = document.getElementsByClassName("livePreReportMember");
			for (var i = 0; i < avatars.length; i++) {
				avatars[i].classList.remove("bounceInDown");
			}
			var connectionUser = document.getElementById("livemember-" + snapshot.key);
			console.log(snapshot.val());
			console.log(connectionUser);
			if (snapshot.val().live === false && connectionUser != null) {
				connectionUser.classList.add("bounceOutUp");
				setTimeout(function(){
					connectionUser.remove();
				}, 1000);
			}

			else if (snapshot.val().live === true && connectionUser === null) {
				checkLivePreReport();
			}
		});

		// init count event
		document.getElementsByClassName("ql-editor")[0].addEventListener("keyup", wordCount);
		document.getElementsByClassName("ql-editor")[0].addEventListener("keyup", editorPosition);

		// start to listen for changes
		document.getElementsByClassName("ql-editor")[0].addEventListener("keyup", preReportChanges);

		// enables collaboration
		var editor = document.getElementsByClassName("ql-editor")[0];
		return new Promise(function (resolve, reject) {
			Pusher.logToConsole = true;
		    var pusher = new Pusher('5a02536f423cc287a275', {
		      cluster: 'eu',
		      encrypted: true
		    });
		    console.log(collabID);
		    var channel = pusher.subscribe(collabID);
		    channel.bind('client-text-edit', function(html) {
		    	console.log(html);
		      editor.innerHTML = html;
		    });
		    channel.bind('pusher:subscription_succeeded', function() {
		      resolve(channel);
		    });
		  	}).then(function (channel) {
			function triggerChange (e) {
			    channel.trigger('client-text-edit', e.target.innerHTML);
			    console.log(123);
			}
		// update UI
	    editor.addEventListener('input', triggerChange);
	  	});
	}
}

// count words in editor
function wordCount() {
	var counter = 0;
	var sentences = this.childNodes;
	var words = document.getElementById("words");
	for (var i = 0; i < sentences.length; i++) {
		// count total words
		if (sentences[i].innerHTML != "<br>") {
			counter += sentences[i].innerHTML.split(" ").length;
			words.innerHTML = counter + " words";
		}

		// check if empty
		if (sentences[0].innerHTML === "<br>") {
			words.innerHTML = "";
		}
	}
}

// track and display current position
var currentText;
function editorPosition() {
	if (window.getSelection) {
	    var selection = window.getSelection();
	    if (selection) {
	    	// Mozilla browsers
	        if (selection.getRangeAt) {
	            if (selection.rangeCount >=1 ) {
	                var range = selection.getRangeAt(0);
	                var parentEl = range.commonAncestorContainer;
	                if (parentEl.nodeType != 1) {
		                currentText = parentEl.parentNode;
		            }

		            // run display position after finding element
	               	displayPosition();
	                return [range.startContainer, range.startOffset];
	            }
	        } 

	        // Webkit browsers
	        else if (selection.focusNode) { 
	            return [selection.focusNode, selection.focusOffset];
	        }
	    }
	}
}

// display a indicator where the user have worked / is working
function displayPosition() {
	// clear blanks and <br>
	var writtenBy = document.getElementsByClassName("writtenBy-" + uidKey);
	for (var i = 0; i < writtenBy.length; i++) {
		if (writtenBy[i].childNodes[0].tagName === "BR") {
			writtenBy[i].style.borderLeft = "none";
		}
	}

	// set color id
	var colorCont = document.getElementById("livemember-" + uidKey).style.border.split(" ");
	var color = colorCont[2] + colorCont[3] + colorCont[4];

	// set indicator
	if (currentText.innerHTML != "<br>") {
		currentText.classList.add("writtenBy-" + uidKey);
		currentText.style.borderLeft = "1px solid " + color;
		currentText.style.paddingLeft = "5px";
	}

	// clear blanks and childs for smooth transition
	for (var i = 0; i < writtenBy.length; i++) {
		if (writtenBy[i].childNodes[0].tagName === "BR") {
			writtenBy[i].style.borderLeft = "none";
		}

		if (writtenBy[i].parentElement.tagName != "DIV") {
			currentText.style.borderLeft = "none";
			currentText.style.paddingLeft = "0px";
		}
	}
}

// check for members currently editing the report
var takenColors = [];
var liveCount = 0;
function checkLivePreReport() {
	// color array
	var colors = ["#ef5350", "#ab47bc", "#b388ff", "#3f51b5", "#8c9eff", "#03a9f4", "#4db6ac", "#66bb6a", "#9ccc65", "#afb42b", "#fbc02d", "#ff6d00", "#6d4c41"];
	// make user editing status live 
	var preReportLiveRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/live");
	preReportLiveRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
			if (child.val().live === true) {
				// display online members avatars
				var memberRef = firebase.database().ref("accounts/" + child.key);
				memberRef.once("value", function(snapshot) {
					if (document.getElementById("livemember-" + child.key) === null) {
						var avatar = document.createElement("img");
						avatar.id = "livemember-" + child.key;
						avatar.classList.add("col-sm-2") + avatar.classList.add("projectAvatar") + avatar.classList.add("livePreReportMember") + avatar.classList.add("animated") + avatar.classList.add("bounceInDown");
						avatar.src = snapshot.val().Avatar_url;

						// color code check
						var colorRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/live/" + child.key);
						colorRef.once("value", function(snapshot) {
							if (snapshot.val().colorCode === null || snapshot.val().colorCode === undefined) {
								colorRef.update({
									colorCode: colors[liveCount]
								});
								avatar.style.border = "2px solid " + colors[liveCount];
							}

							else {
								avatar.style.border = "2px solid " + snapshot.val().colorCode;
							}
							document.getElementById("preReportLiveMembers").appendChild(avatar);
							liveCount++;
						});
					}
				});
			}
		});
	});
}

// listen for changes
function preReportChanges() {
	// create new listen ref if not present
	var preReportListenRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/report/main");
	var content =  document.getElementsByClassName("ql-editor")[0].innerHTML;

	// clear current
	var current = document.getElementsByClassName("current");
	for (var i = 0; i < current.length; i++){
		current[i].classList.remove("current");
	}

	// update data
	preReportListenRef.update({
		//content: content
	});

	// set updated values in realtime
	var listenParent = firebase.database().ref("projects/" + selectedProject + "/pre-report/report");
	listenParent.on("child_changed", function(snapshot) {
		preReportListenRef.once("value", function(snapshot) {
			snapshot.forEach((child) => {
				//document.getElementsByClassName("ql-editor")[0].innerHTML = child.val();
				console.log(document.getElementsByClassName("current"));
			});
		});
	});
}

// exit pre report
function exitPreReport() {
	// make user status offline
	var preReportLiveRef = firebase.database().ref("projects/" + selectedProject + "/pre-report/live/" + uidKey);
	preReportLiveRef.update({
		live: false
	});
}

// timesheet for project member
var commitCount = 0;
var hoursCount = 0;
var dayCount = 0;
var timesheetName;
var recentActivityName;
function timesheet() {
	// get key
	selectedAvatar = uidKey;
	if (this.tagName === "IMG") {
		selectedAvatar = this.id.split("-")[1];
	}

	// init hour check
	document.getElementById("timesheetHour").addEventListener("keyup", checkHour);

	// set img and name
	var accRef = firebase.database().ref("accounts/" + selectedAvatar);
	accRef.once("value", function(snapshot) {
		document.getElementById("timesheetAvatar").src = snapshot.val().Avatar_url;
		document.getElementById("timesheetUsername").innerHTML = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
		timesheetName = snapshot.val().First_Name.capitalizeFirstLetter();
		recentActivityName = snapshot.val().First_Name.capitalizeFirstLetter() + " " + snapshot.val().Last_Name.capitalizeFirstLetter();
	});

	// get main container
	var hoursCont = document.getElementById("mainTimesheetHour");
	var descCont = document.getElementById("mainTimesheetDesc");
	var dateCont = document.getElementById("mainTimesheetDate");

	// reset on load
	document.getElementById("mainTimesheetHour").innerHTML = "";
	document.getElementById("mainTimesheetDesc").innerHTML = "";
	document.getElementById("mainTimesheetDate").innerHTML = "";
	document.getElementById("timesheetInputCont").style.display = "none";
	document.getElementById("addTimesheetNoteMainCont").style.display = "none";
	commitCount = 0;
	hoursCount = 0;

	// load members
	var members = [];
	var membersCont = document.getElementById("timesheetAvatars");
	membersCont.innerHTML = "";
	var projectMembersRef = firebase.database().ref("projects/" + selectedProject + "/members");
	projectMembersRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {
				members.push(child.val());
		});
		
		// create member avatars
		for (var i = 0; i < members.length; i++) {
			// set img src to be avatar url
			var memberRef = firebase.database().ref("accounts/" + members[i]);
			memberRef.once("value", function(snapshot) {
				var img = document.createElement("img");
				if (snapshot.val().Avatar_url != undefined) {
					img.src = snapshot.val().Avatar_url;
				}

				else {
					img.src = "/img/avatar.png";
				}

				// init timesheet event for members
				img.id = "member-" + snapshot.key;
				img.addEventListener("click", timesheet);
				membersCont.appendChild(img);

				// modificate timesheet styles and inputs depending on who user is viewing
				if (selectedAvatar === uidKey) {
					document.getElementById("member-" + uidKey).style.display = "none";
					document.getElementById("timesheetInputCont").style.display = "inline-flex";
					document.getElementById("addTimesheetNoteMainCont").style.display = "block";
				}

				else {
					document.getElementById("member-" + uidKey).style.display = "inline-block";
					document.getElementById("timesheetInputCont").style.display = "none";
					document.getElementById("addTimesheetNoteMainCont").style.display = "none";
				}
			});
		}
	});

	// load timesheet values
	var timesheetRef = firebase.database().ref("projects/" + selectedProject + "/timesheet/" + selectedAvatar);
	timesheetRef.once("value", function(snapshot) {
		snapshot.forEach((child) => {

			// commits and hours count
			commitCount++;
			hoursCount += parseInt(child.val().hours);

			// hour
			var contH = document.createElement("div");
			contH.classList.add("col-lg-12") + contH.classList.add("timesheetRow") + contH.classList.add("timesheetRowHour") + contH.classList.add("animated") + contH.classList.add("fadeIn");
			var hour = document.createElement("p");
			hour.innerHTML = child.val().hours;
			contH.appendChild(hour);

			// description
			var contD = document.createElement("div");
			contD.classList.add("col-lg-12") + contD.classList.add("timesheetRow") + contD.classList.add("timesheetRowDesc") + contD.classList.add("animated") + contD.classList.add("fadeIn");;
			var desc = document.createElement("p");
			desc.innerHTML = child.val().description;
			contD.appendChild(desc);

			// date
			var contDt = document.createElement("div");
			contDt.classList.add("col-lg-12") + contDt.classList.add("timesheetRow") + contDt.classList.add("timesheetRowDate") + contDt.classList.add("animated") + contDt.classList.add("fadeIn");;
			var date = document.createElement("p");
			date.innerHTML = child.val().date;
			contDt.appendChild(date);

			hoursCont.appendChild(contH);
			descCont.appendChild(contD);
			dateCont.appendChild(contDt);
		});

		// commit data
		document.getElementById("commitsDataInfo").innerHTML = timesheetName +  " has made a total of " + commitCount + " commits over " + hoursCount + " days.";

		// style rows
		var rowCount = 0;
		var rowsHour = document.getElementsByClassName("timesheetRowHour");
		var rowsDesc = document.getElementsByClassName("timesheetRowDesc");
		var rowsDate = document.getElementsByClassName("timesheetRowDate");
		for (var i = 0; i < rowsHour.length; i++) {
			rowCount++;
			if (rowCount > 1) {
				rowsHour[i].style.borderTop = "none";
				rowsDesc[i].style.borderTop = "none";
				rowsDate[i].style.borderTop = "none";
			}
		}

		// display message if no rows
		if (rowCount === 0) {
			document.getElementById("noEntries").style.display = "block";
			document.getElementById("noEntriesImg").style.display = "block";
			document.getElementById("commitsData").style.display = "none";
		}

		else {
			document.getElementById("noEntries").style.display = "none";
			document.getElementById("noEntriesImg").style.display = "none";
			document.getElementById("commitsData").style.display = "block";
		}
	});

	// get time stamp
	var now = new Date();
	var year = now.getFullYear();
	var month = now.getMonth()+1; 
	var day = now.getDate();

	// add zeros if needed
	if (month.toString().length == 1) {
		var month = '0' + month;
	}
	if (day.toString().length == 1) {
		var day = '0' + day;
	}   

	// set todays date
	var dateTime = day + '.' + month + '.' + year;
	document.getElementById("timesheetDate").value = dateTime;

	// init new timesheet entry
	document.getElementById("addTimesheetNote").addEventListener("click", addTimesheetEntry);
}

// check hour for valid number input
var validHour = false;
var splitCheck;
function checkHour(evt) {
	if (this.value.length > 2) {
        this.value = this.value.slice(0,2);
    }

   else if (this.value.length > 2) {
   		validHour = false;
   }

    else {
    	validHour = true;
    }

    // replace first index if 0
    if (parseInt(this.value.split("")[0]) === 0) {
    	console.log(123);
    	this.value = this.value.slice(0,0);
    }

    // check values
    splitCheck = this.value.split("");
    if (splitCheck === "" || splitCheck.length === 0) {
    	validHour = false;
    }

    console.log(validHour);
}

// add a new entry to the timesheet table
function addTimesheetEntry() {
	// get main container
	var hoursCont = document.getElementById("mainTimesheetHour");
	var descCont = document.getElementById("mainTimesheetDesc");
	var dateCont = document.getElementById("mainTimesheetDate");

	// get input values
	var hours = document.getElementById("timesheetHour");
	var description = document.getElementById("timesheetDescription");
	var date = document.getElementById("timesheetDate");

	// check hour
	if (validHour === false) {
		document.getElementById("addTimesheetNoteError").style.display = "block";
		document.getElementById("addTimesheetNoteError").innerHTML = "Hour input is not valid!";
		return;
	}

	// check desc
	if (description.value === "") {
		document.getElementById("addTimesheetNoteError").style.display = "block";
		document.getElementById("addTimesheetNoteError").innerHTML = "Please enter a description!";
		return;
	}

	if (description.value.length < 10) {
		document.getElementById("addTimesheetNoteError").style.display = "block";
		document.getElementById("addTimesheetNoteError").innerHTML = "Description needs to be atleast 10 characters!";
		return;
	}

	if (description.value.length > 255) {
		document.getElementById("addTimesheetNoteError").style.display = "block";
		document.getElementById("addTimesheetNoteError").innerHTML = "Description cant be longer than 255 characters!";
		return;
	}

	document.getElementById("addTimesheetNoteError").style.display = "none";

	// add commit to project recent activites
	var recentActivity = firebase.database().ref("projects/" + selectedProject + "/activity/" + new Date().getTime());
	recentActivity.update({
		name : recentActivityName,
		userKey: uidKey,
		hours: hours.value,
		description: description.value,
		date: date.value
	});

	// create timesheet and store
	var timesheetRef = firebase.database().ref("projects/" + selectedProject + "/timesheet/" + uidKey + "/" + new Date().getTime());
	timesheetRef.update({
		hours: hours.value,
		description: description.value,
		date: date.value
	});

	// hour
	var contH = document.createElement("div");
	contH.classList.add("col-lg-12") + contH.classList.add("timesheetRow") + contH.classList.add("timesheetRowHour");
	var hour = document.createElement("p");
	hour.innerHTML = hours.value;
	contH.appendChild(hour);

	// description
	var contD = document.createElement("div");
	contD.classList.add("col-lg-12") + contD.classList.add("timesheetRow") + contD.classList.add("timesheetRowDesc");
	var desc = document.createElement("p");
	desc.innerHTML = description.value;
	contD.appendChild(desc);

	// date
	var contDt = document.createElement("div");
	contDt.classList.add("col-lg-12") + contDt.classList.add("timesheetRow") + contDt.classList.add("timesheetRowDate");
	var dateTime = document.createElement("p");
	dateTime.innerHTML = date.value;
	contDt.appendChild(dateTime);

	// append to cont
	hoursCont.appendChild(contH);
	descCont.appendChild(contD);
	dateCont.appendChild(contDt);

	// style rows
	var rowCount = 0;
	var rowsHour = document.getElementsByClassName("timesheetRowHour");
	var rowsDesc = document.getElementsByClassName("timesheetRowDesc");
	var rowsDate = document.getElementsByClassName("timesheetRowDate");
	for (var i = 0; i < rowsHour.length; i++) {
		rowCount++;
		if (rowCount > 1) {
			rowsHour[i].style.borderTop = "none";
			rowsDesc[i].style.borderTop = "none";
			rowsDate[i].style.borderTop = "none";
		}
	}

	// update data
	commitCount++;
	hoursCount += parseInt(hours.value);
	document.getElementById("commitsData").style.display = "block";
	document.getElementById("commitsDataInfo").innerHTML = timesheetName +  " has made a total of " + commitCount + " commits over " + hoursCount + " days.";


	// display message
	snackbar.innerHTML = "Entry succesfully added!";
	snackbar.className = "show";
	setTimeout(function(){ snackbar.className = snackbar.className.replace("show", ""); }, 3000);

	hours.value = "";
	description.value = "";
}


/******************************** END PROJECT ***********************************/
