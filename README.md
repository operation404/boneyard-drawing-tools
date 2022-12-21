# Boneyard
Boneyard is a module for the general use tools I write for my Foundry games. Right now, it includes the following tools:
- [Quick drawing tool settings menus](#quick-drawing-tools-colorsettings-adjuster)
- [Socketlib anonymous function wrappers](#socketlib-wrapper-functions-for-executing-anonymous-functions)

Be sure to meet the [Requirements](#requirements) before using Boneyard.

## Quick drawing tools color/settings adjuster
Boneyard adds two new tools to the Drawing sidebar. These tools open a quick menu that allows fast adjustment of stroke or fill color, opacity, line width, and fill type. The changes to drawing settings are continuously updated as you make adjustments on the panel, and it can be closed by clicking anywhere off of it.

The first tool controls line settings. The menu for lines contains options for changing stroke color, opacity, and line width.

![Stroke Example. The line menu has options for changing stroke color, opacity, and width.](https://github.com/operation404/fvtt-boneyard/blob/main/images/stroke_example.png?raw=true)

The second tool controls fill settings. The menu for fill contains options for changing fill color, opacity, and fill type.

![Stroke Example. The line menu has options for changing stroke color, opacity, and width.](https://github.com/operation404/fvtt-boneyard/blob/main/images/fill_example.png?raw=true)

## Socketlib wrapper functions for executing anonymous functions
It is possible to execute anonymous functions through the wrapper functions Boneyard provides. Boneyard converts the function to a string and sends that string through socketlib to a registered handler which parses the string back into a function and executes it. 

```js
Boneyard.executeForEveryone_wrapper((args) => {
  console.log(`Greetings ${game.user.name}!`);
});

// Each user should see 'Greetings' followed by their name
```

The functions can have a single argument called *args* which should be an object that contains any actual arguments the function might need.

```js
let result = await Boneyard.executeAsGM_wrapper((args) => {
  console.log(args.a);
  console.log(args.b);
  let c = args.a+args.b;
  console.log(c);
  return c;
}, {a: 5, b: 3});

result += 1;
console.log(result);

// Should output 5, 3, 8, and 9
```

Keep in mind that when *args* is sent through socketlib it is converted into a JSON object before being converted back on the other client. Therefore any objects *args* possessed will be copies of their original and any references will likely be broken. The function being executed will also be in the global scope instead of the current scope at the time of calling the Boneyard wrapper. This means that while your function cannot access local variables in the scope it was declared in, it can still access global foundry variables such as *game*, as seen in the first example.

***Note:*** *I am a novice in regards to JS and this might not be an entirely accurate description of what's really going on, but it's my best understanding of the limitations of socketlib.*

```js
// This will cause errors when any client other than the sender executes the
// function because game.user.targets won't correctly persist through the socket
Boneyard.executeAsGM_wrapper((args)=>{
    args.targets.forEach(token => { // Throws an error
        token.actor.update({
            "data.hp.value": token.actor.data.data.hp.value - 1, // Reduce target hp by 1
        });
    });
}, args={targets: game.user.targets});

// This is a workaround for the above. Token ids are strings and can be safely sent
// over sockets, the receiving client can then find the desired tokens by their id
Boneyard.executeAsGM_wrapper((args)=>{
    args.target_ids.forEach(id => { // Find each token the player had targeted
        let token = canvas.tokens.placeables.find(token => token.id === id);
        token.actor.update({
            "data.hp.value": token.actor.data.data.hp.value - 1, // Reduce target hp by 1
        });
    });
}, args={target_ids: game.user.targets.ids});
```

Boneyard provides a wrapper for each of the socketlib call functions.

```js
static executeAsGM_wrapper = async (func, args) => {...};
static executeAsUser_wrapper = async (userID, func, args) => {...};
static executeForAllGMs_wrapper = async (func, args) => {...};
static executeForOtherGMs_wrapper = async (func, args) => {...};
static executeForEveryone_wrapper = async (func, args) => {...};
static executeForOthers_wrapper = async (func, args) => {...};
static executeForUsers_wrapper = async (recipients, func, args) => {...};
```

If desired, you can also access Boneyard's socket directly as well as use the functions used for convering and recovering functions to and from strings. Since socketlib requires the function being called to be registered, this likely isn't very useful unless you use a world script or modify this module to register more functions, since the only registered function is Boneyard's *boneyard_exec* function and Boneyard already wraps each possible socketlib call with it.

```js
let result = await Boneyard.socket.executeAsGM("boneyard_exec", 
  Boneyard.prepare_func(() => {console.log("Hello!"); return 5;})
);
console.log(result);

// Sender should log '5', GM should log 'Hello!'
```

## Requirements
The following modules are required for Boneyard to function properly:
* [socketlib](https://github.com/manuelVo/foundryvtt-socketlib)

