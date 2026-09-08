### The backend project... that is my first one

Its definitely been a while since i wrote something, Why? even i dont know. What i do know is that i should write what i learnt more often which i am doing now!!! i learnt how to overthink and talk to myself ig.

Been two days since i started learing how to make API, since i had only ever used the fetch method of API's that left the gap that i didnt know other methods... and i knew what i gotta do, yep gotta make an API from scratch. Wow such a nice idea i guess... NOPE this is kinda 2 birds one stone thinking of mine, what i mean is i get to learn various fetch methods AND how to create API or a little taste of how backend works and so far its going good and not that difficult and that too i know why. It is because im using expressjs instead of learning nodejs from scratch but well? its fine because what i learnis not going to waste its just that i will be learning concepts first here and then i can just learn node fresh because i know concepts only thing that will change is syntax.

enough chit chat time to write fr,

1.  Get methods these are the listeners for get request we post by fetch() whoose default method is get, we can set up/define a path the node script can listen for and respond according to the logic we write and basically it works like that. since this is just a get request the user cant edit anything with this request ever unless we write up logic for it.

2.  Post methods, these are listening for any request that wants to post to the path and this can be risky if we accept just about any data and put it in our database, could be a malware, could be something else... idk anymore im not much into security (for now i plan to lean on security at some point but not now ofc)

3.  We can access the request using the request arguments, its like this we define the path like app.get() or app.post etc depending on what the path is for commonly it can be delete too so that, and after that we do app.get(path you want to make/listen for ,callback function here (request,response)=>{
    the request has features like

        a. request.params.whatever data there is in the path the params gives you an object containing the values you got with the path we do it specifically by using path/:value/:another value etc the params will return both if both exist or 1 if you define one( we can have as many as we want but i dont think we should complicate it too much);

        b. response response is what we send back when the request hits it has methods like .status which sends the status code like 200 for success 400 for no data 402 for wrong data given and many more i gotta learn
        and we can chain it like response.status(code in number).send( you data you want to send back )

    })

4.  Finally... how to make the backend listen? we do app.listen(here we give it an port that is unused by our computer, probably 3000 to 5000 is fine ) then you go to the port you set up like localhost:port number... yeah localhost because im broke and cant afford to buy a domain just for this site... not just for this site. Any site at all

# Day 3

I practiced kind of sign up and register logic using app.post, it was like this => we get the users data in the body in json format then we format to normal object and check if the user exist in a array by matching email if it does exist we return an error but if it doesnt we push to the array and and return the id we gave to the newly registered user which they will use to login again.

# Day 4

Basically today i created the database schema and tried to avoid as many security issues as i could while doing so i also had to make sure that the data i put in the database is easily accessible by querries.
Also had to make sure the database is scalable since i have a lot A LOT of features planned but i am aware of the scope of this project must not rise too much that i get overwhelmed and leave the project mid build, so far im actually enjoying the change of pace this backend project gave me, i dont need to fight the UI here or tailwind bugs to solve. Here its either it works or it doesnt (also... it works is not the same as it works fine, many security issues can be ignored if we just track it works) and i am definitely gonna fix security issues first and foremost (any that i find, i am an expert at overthinking scenarios XD )

# General decisions taken today

1. This is actually just a standard not an actuall decision i think but i used or should i say i limited the amount of characters users can put into database, the input that comes from the users cant be trusted in the least, they could try to
   a. overload the database storage and RAM Render provides per request which is 4gb i think and the total storage im allowed on render is 500mb which is a lot for a practice project but its not a lot if we think abou these scenarios-

   which was: the user inputs gibberish random text that has many characters TOO MANY that is with the interntion of slowing down the API because everytime the user sends something to API it costs time and storage if we store it in database raw,

   if the text was a bunch of random text or symbols or whatever gibberish, because the requests are bound to carry the data if the data is too large it is slowed down then when it reaches here in backend who knows if it might be too much for the backend to handle and the server at Render goes _KABOOM_
   jk but its bad if they do that

   so i limited the amount of text they can store to the database by using methods like count(text<=40) for name and count(text<=220) for emails i am only enforcing this rule to the input i receive from the users but not on the input i get from our own API or the predefined values users cant edit.

   b. I have had been thinking how will the user stay logged in when their access token expires,
   its a option that we give them a new one but its also very bad UX if each time they try to login or their acess token expires we create one then we send it then the user resumes what he was doing.

   This is very slow and since the access token should be shortlived for security purposes like leaked the acesstoken by a dumb person,
   A very _#INTELIGENT_ person edited the token that he got so its now invalid, so i adopted a well known approach that is storing a recovery code the database holds which can be used to get issued another access token with some time limit like 1hour
   when it expires the user gets a new one, simple...

   no not so simple then i thought what if the user gave their acc to someone(bad thing entirely) or logged in a device that they wont use anymore, they logout from account when the device is not with them but what happens after that? to do that i will need to delete the recovery key of that device specifically. we cant do that because if i deleted that refresh token from the database tied to the account the orignal user also loses his recovery token and we have to give him another one, we can just avoid all this mess if we just tie the recovery keys to sessions instead, each device that gets logged in by the same account gets a separate recovery key for that user on that device that we can freely revoke if they just want to logout from 1 device and keep logged in on the diffrent device only or log out from all devices if they wish to.

# Caught issues

Just making the site work is never enough is it? especially when we are holding data of other users. it should never be able to be leaked or... the edge cases like i caught yesterday should be resolved Elegantly. so that user isnt stuck with the API... and it can happen easily too, like i for example forgot to call the next() in the middleware then the request is effectively stuck, not gonna be fullfilled/throw error, just stuck till the timeout of request

and what i caught successfully on my own was

1. I identified a possible bug that might happen in a specific scenario that was... since i plan to implement a pet store in the site which is kind of like a global marketplace for every user.
   WHAT if two users click the buy/adopt or whatever button at the same time to get the pet? what happens then?
   this was the question that struck me in the planning phase

## solution

    we check the database before giving the users the pet real time in database first then issue the pet to the user, if the pet was taken first then the second user gets an error when he tried to adopt the pet

## sub problem it introduced

    Now the issue it could give is, the market place or PET STORE is a stale state of the database at the time each user accessed the database to get that data list, what happens if the pet was adopted after a diffrent user goes to the pet store?
    Now the issue is like this. User A fetched the database for pet store at 2:AM (at night idk why)
    user B adopt some pet from the store, normally the data user A should be updated right? but that cant be done.
    why? i dont want to implement a websocket at all it will increase the CU hours which i am already limited to
    because of free account of the NEON database.

## another problem

    even if i implemented the websockets, the pet store data will be very jittery and each database modification of the pet store data  adopt / abandon will cause a reRender which might not seem that big now with 0 users or 2-4 user, think what happens if the app has 300 users? if even 25% of them decided to adopt and abandom the pet at same time the pet store will be rerender/updated so much that a normal browsing experience cant be guaranted.

## solution

    we dont update the data each time the change happens, we read if the pet can be adopted at all when the user click the button adopt.
    as for showing the new updated pet we will handle it by just letting the user reload the page or a refetch button / refresh while setting a throttling behavior to avoid abusing the refresh.

# Day 5 & 6

I'm kinda happy now that i have finished basic login and signup features of the site but still stingy that they arent perfect but its okay, since this whole project doesnt need to be perfect it just needs me to learn express and prostgress good enough that i dont need to search syntax on google and most frequent used patterns,

but this doesnt mean i can neglet whats hard and only learn easy things and trying to atleast learn best practices used if i decide not to implement here in this project i should be able to implement in other projects

currently i learnt of dual refresh token pattern (refresh token rotation) that works by generating a new refresh token each time user asks for a accesstoken, then deleting the orignal refreshtoken from database and returning new refresh token to the user so on the next refresh request they use that token easily,

this ensures if the access token got leaked and refreshtoken too, then user can get atleast an alert that thier id is compromised so he can contact us to delete that refreshtoken and issue them a new one.

this can also backfire if not well done, the flow is like this
signup/login => give refresh token A and access token => access token expires => call refresh to get new access token => check refresh token if match we delete refresh token A, create a refresh token b and give it to user to use in their next refresh request

if you notice there is no way to know who is accessing the refresh token A but we also might block the user out in case the account is compromised because if attacker/diffrent people call the request to issue new access token before the actual owner the refresh token that orignal user has is now deleted from database so now its invalid, user can now file an request to delete that request token B, C, D or whatever the active token is in database and issue a new one.

but this depends on user if he reports or not.

# Day 7, 8 & 9

## Lets actually start by explaining what i learnt these days

### Middlewares -

They are functions, but special functions. they dont necessarily return the actual response most of the time what they do is check for things which we ask them to do, like a security guard that you assign a role he can promptly deny access if something is wrong with the response but cant directly give you the response you came to him for, he will let you pass through after running checks each one verifying some logic we wrote after that it reaches the endpoint it was supposed to do.

## Lets see how im using them

I have a middleware called requireAuth
lets start with what it does-
it is a veryfying middleware that I set up to check if the user is authenticated or in other words an actual user or not before accessing protected routes.
Its rather simple one tho, im not aware of how actual production grade software handle it, but it verifies by

    a. taking the access token we recieve in request header since access token is a jwt signed token we can verify if its valid access token or a sham one or just a random string,
    b. IF it finds that the token given is invalid string or expired it returns the function early before the response even reaches its destination.

    it does it by using jwt.verify function that takes the token and runs tests on it and also decodes it for us so we can even pass it to another middleware or the actual endpoint.

    in this one the access token is always an userid that got signed by jwt.sign with a special set of characters we call it JWT_SECRET (a hex string that helps jwt in encoding the data we give jwt to sign).

    b. IF it verifies that token is correct format it needs in It then attaches the userid we decoded from jwt.verify to the request and call next function (next is necessary if we dont call next or return an response the app is stuck in this function doing nothing till the timeout closes the request by browser).

### Routes-

What they can be think of as are separate folders or office rooms, ofcourse we can cram every route the backend listens for in index.ts but thats not very good to do because if we do that whenever we want to update or add a new route we will need to find it from possibly hundreds of lines of code blocks which is aslo not very maintainable and breaks separation of logic / functions in parts standard.

## What to do then?

Instead of putting every endpoint in index.ts we can make separate environment / offices where endpoints exists
when index.ts sees an endpoint trying to access an office it sends its route to that office rather than handle it all here that office now can decide what user want to do based on their url.

# Example

You go to an main office finding an employee there, you know what dept he works in you then ask the dept receptionist (index.ts) where is this dept located the receptionist shows you the way, then you ask for that specific person in that dept and the dept knowing all the employeees working in their dept can send you to the person you orignally wanted to meet

- This whole interation happens because we dont tell the index.ts (main receptionist) what employee works in office it only needs to know what dept exists so it can send the people to whatever dept user want to visit
  Although its just a code it can remember even thousands or millions of code blocks (endpoints) and still send you to the right destination we cant maintain something so big without taking out chunks of it to diffrent files and organizing it in a way other people can understand and maintain our code too.

# The process

First we need to import the Route from express so we can define that this is a route and give it a name so we can call it, listen to it etc,

for example lets make a route called myPersonalRoute the syntax will be
const myPersonalRoute = Route();
now a new route has been created you can listen to the route for any request and respond accordigly based on what the route wants.

then we need to regiset that route to index.ts so index.ts knows this route exists and send the relevant request to the route instead of handling it on its own internally

We do so by using app.use('/whatever-you-want',myPersonalRoute) now any request starting with /whatever-you-want will be handled by the route not the index.ts the url might look like this http://host:300/whatever-you-want/something;

- Here the route only knows what comes after /whatever-you want part not the entire path index.ts kinda consumed it now your router got only /something not the whole path. Where you can handle /something by using its own middleware (#Controller) function.

- IF you want you can handle '/' path in a route too so index.ts has a diffrent handling for its own '/' path while the route got its own handling of '/' path.


