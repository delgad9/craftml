# craftml


## What is a _craft_?

We define a `craft` as something that can craft 3D printable models. 

A more technical defnition is "a generator for parameteric 3D constructive solid geometries."

# Hello World

__Install__

	$ npm install -g craft

__Design__

`helloworld.xml`

```html
<craft>
Hello World
</craft>
```

__Craft__

	$ craft build helloworld.xml // ==> generates `helloworld.stl`
	
__View__

`helloworld.stl`

![hello world](assets/helloworld.png)

__Print__



# Remixing

## Coat Hanger

Suppose we want to design a coat hanger consisting of four pins on a flat borad. Luckily, someone has already made a craft for boards. Someone else has already made a craft for pins. These crafts have been published and shared online as modules `craft-pin` and `craft-board` respectively.

`hanger.xml`

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

<script src="https://embed.github.com/view/3d/sikuli/craftml/master/assets/hanger.stl"></script>

Before you can run the `craft` command, you need to install the `craft-pin` and `craft-board` modules. `craftml` uses `npm` to manage, publish, share, discover, and install crafts.

Install `craft-pin` and `craft-board` by

	$ npm install craft-pin	
	$ npm install craft-board

Craft the coat hanger

	$ craft build hanger.xml

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
	<parameter name="height" type="init" default="1"/>
	<script type="text/openjscad">
		function main(params){
			return cube().scale([1,params.height,1])
		}
	</script>	
</craft>
```

In `main(params)`, `params` is resolved to 5.