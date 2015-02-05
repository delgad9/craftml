# craftml


### What is a _craft_?

As a noun, we define a `craft` as a tool or a program that can generate 3D printable models. The technical defnition is _"a generator for parameteric 3D constructive solid geometries."_

### What is _CraftML_?

A markup language using an HTML-like syntax for defining a _craft_. One can use CraftML to define the individual parts of a model and the layout of these parts.

# Install

	$ npm install -g craft


# Hello World

__Design__

`helloworld.xml`

```html
<craft>
	Hello World
</craft>
```

__Preview__

	$ craft preview helloworld.xml
	
![preview_helloworld](assets/preview_helloworld.png)


__Build__

	$ craft build helloworld.xml
	
It outputs `helloworld.stl`.
	
__Print__


![helloworld_replicatorG](assets/helloworld_replicatorG.png)


# Getting Started

## Coat Hanger

Let's craft a coat hanger with four pins on a flat borad. Luckily, we don't need to start from scratch. We can use existing crafts made by others to generate individual parts and use the _CraftML_ language to assemble these parts together into a coat hanger.  

Install the `craft-pin` and `craft-board` modules.

	$ npm install craft-pin	
	$ npm install craft-board

Create `hanger.xml` with the contents below.

```html
<craft>
	<craft name="pin" module="craft-pin"/>
	<craft name="board" module="craft-board"/>
	<board>
		<pin></pin>
		<pin></pin>
		<pin></pin>
		<pin></pin>
	</board>						
</craft>
```

Run `craft preview` to see the model in a web browser.

	$ craft preview hanger.xml
	
This command reads the contents of `hanger.xml`, builds a 3D model, opens up the default web browswer, and displays the model.

![hanger_preview](assets/hanger_preview.png)

Let's add a couple more pins. The browser will automatically refreshes itself to dislay the updated model.

![hanger_preview2](assets/hanger_preview2.png)

Once you are happy with the model, run `craft build` to build an _stl_ file that can be sent to a 3D printer.

	$ craft build hanger.xml

This command will produce `hanger.stl`. This is how the model looks like in [cura](https://ultimaker.com/en/products/software). 

![hanger_cura](assets/hanger_cura.png)

[Click here to view the mmodel on Github](assets/hanger.stl)

## Stacking

We can stack things up using the `<stack>` tag.

```html
<craft>
	<craft name="pin" module="craft-pin"/>
	<craft name="board" module="craft-board"/>
	<board>
		<stack>
			<pin></pin>
			<pin></pin>
			<pin></pin>
			<pin></pin>
		</stack>
	</board>						
</craft>
```

![tower](assets/pins_tower.png)

Four stacks of pins

```html
<craft>
	<craft name="pin" module="craft-pin"/>
	<craft name="board" module="craft-board"/>
	<board>
		<stack>
			<pin></pin>
			<pin></pin>
			<pin></pin>
			<pin></pin>
		</stack>
		<stack>
			<pin></pin>
			<pin></pin>
			<pin></pin>
		</stack>
		<stack>
			<pin></pin>
			<pin></pin>
		</stack>
		<stack>
			<pin></pin>
		</stack>		
	</board>						
</craft>
```

![stairs](assets/pins_stair.png)

## Subcraft

* can be used to define a sub-component that can be reusable

```html
<craft>
	<craft name="pin" module="craft-pin"/>
	<craft name="board" module="craft-board"/>
	<craft name="tower">
        <stack>
            <pin></pin>
            <pin></pin>
            <pin></pin>
            <pin></pin>    
        </stack>
    </craft>
    <board>
    	<tower></tower>
        <tower></tower>
        <tower></tower>
        <tower></tower>
    </board>
</craft>
```
![pins_towers](assets/pins_towers.png)




# OpenJSCAD

```html
<craft>
	<script type="text/openjscad">
		function main(){
			return cube()
		}
	</script>
</craft>
```

![cube](assets/cube.png)

### Multiple Script Blocks
```html
<craft>
	<script type="text/openjscad">
		function main(){
			return cube()
		}
	</script>
	<script type="text/openjscad">
		function main(){
			return cube().scale([1,0.5,1])
		}
	</script>	
</craft>
```

![high and low](assets/cubehighlow.png)


### Nested Crafts

A craft can be nested in another craft. This is especially useful for generating repeated parts.

Suppose we want to generate a cube and repeat it four times. We can define a nested craft called `cube` that uses a script to generate a cube. Then, we can write four `<cube>` tags to create four cubes.

```html
<craft>
	<craft name="cube">
		<script type="text/openjscad">
			function main(){
				return cube()
			}
		</script>
	</craft>
	<cube></cube>
	<cube></cube>
	<cube></cube>
	<cube></cube>
</craft>
```

![four cubes](assets/4cubes.png)

### Include

We can refactor the previous example by extracting the contents of `<craft name="cube">` and save them to another file called `cube.xml`.

`cube.xml`:

```html
<craft name="cube">
	<script type="text/openjscad">
		function main(){
			return cube()
		}
	</script>
</craft>
```

We can now reuse `cube.xml` to craft as many cubes as we want.

```html
<craft>
	<craft name="cube" src="./cube.xml"/>
	<cube></cube>
	<cube></cube>
	<cube></cube>
	<cube></cube>
</craft>

```
![four cubes](assets/4cubes.png)


## Parameters

The `<parameter>` tag can be used to introduce a parameter to a craft. 

`cube.xml`:

```html
<craft>
	<parameter name="height" type="int" default="1"/>
	<script type="text/openjscad">
		function main(params){
			return cube().scale([1,params.height,1])
		}
	</script>	
</craft>
```
In this example, the `height` parameter is introduced to allow us to easily craft cubes with different heights. The `default` attribute indicates that the default height is `1`.  The `type` attribute indicates that the parameter is an integer. 

Valid parameter types are: 

* `int`
* `string` 
* `float`.

This example crafts four cubes with increasing heights.

```html
<craft>
	<craft name="cube" src="./cube.xml"/>
	<cube></cube>
	<cube height="2"></cube>
	<cube height="3"></cube>
	<cube height="4"></cube>
</craft>
```

![cubes_in_varying_heights](assets/cubes_in_varying_heights.png)

# API

```javascript
var craft = require('craft')

var xml = '<craft>hello world</craft>'

var result = craft.render(xml)
console.log(result.toStl())

```

### Async
```javascript
var result = craft.render(xml, function(error, result){
	if (error)
		throw error
	console.log(result.toStl())
})
```

### Pipe
```javascript
craft.render(xml)
	 .pipe(craft.csg2stl())
	 .pipe(fs.createWriteStream('output.stl'))
```

### Parameters

```javascript
var result = craft.render(xml, {height: 5}, function(error, result){
	console.log(result.toStl())
})
```

`var xml = `

```html
<craft>
	<parameter name="height" type="int" default="1"/>
	<script type="text/openjscad">
		function main(params){
			return cube().scale([1,params.height,1])
		}
	</script>	
</craft>
```

In `main(params)`, `params` is resolved to 5.