# Script

The basic of the rendering operation is to take a source DOM and transforms it into a solid DOM. The `<script>`tag makes it possible to define custom transformations.

Three special variables are made available in a script block.

* `this` the current solid element
* `$scope` the scope in which this solid element is constructed
* `$` the query function for searching, navigating, and manipulating the solid DOM


```html
<script>
	this
	$scope
	$
</script>
```

In fact, most of the built-in rendering capabilities of `craftml` are implemented using the same three special variables.

```javascript
function render_something($scope, $){
	// add something
	this.add('<cube></cube>')
	
	// look for something
	$('something')
	
	// read/write some parameter
	$scope.foo = $scope.foo + 1
}
```

# `this`

`this` refers to the solid element that contains the script block.

```html
<g id="foo">
	<cube></cube>
	<script>
		this.id
		// => foo
		
		this.children
		// => [cube]
	</script>
</g>
```

`this.children` only contains solid elements constructed right _before_ the script block; it does not contain solid elements _after_ the script block that have not yet been constructed.

```html
<g id="foo">
	<cube></cube>
	<script>
		this.id
		// => foo
		
		this.children
		// => [cube]
	</script>
	<sphere></sphere>
</g>
```

In addition, source elements that do not generate solids will not be parts of  `this.children`.

```html
<g id="foo">
	<parameter name="foo" type="int"/>
	<craft name="bar" module="XYZ123"/>
	<cube></cube>
	<script>
		this.id
		// => foo
		
		this.children
		// => [cube]
	</script>
	<sphere></sphere>
</g>
```


## Adding Elements

```html
// source DOM
<g>
	<cube></cube>
	<script>
		this.add('<sphere></sphere>')
	</script>
</g>

// => solid DOM
<g>
	<cube></cube>
	<sphere></sphere>
</g>
```

The transformation between a source element and a solid element is not necessarily an one-to-one relationship. A source element may generate one or more solid elements or even none at all.

```html
// source DOM
<parameter name="a" type="int"/>
<craft name="bar" module="craft-bar"/>
<cube></cube>

// => solid DOM
<cube></cube>
```

Similarly, a script tag can add more than one solid elements to the solid DOM.

```html
// source DOM
<g>
	<sphere></sphere>
	<script>
		this.add('<cube></cube>')
		this.add('<cube></cube>')
	</script>
</g>

// => solid DOM
<g>
	<sphere></sphere>
	<cube></cube>
	<cube></cube>
</g>
```

Or it can add none at all.

```html
// source DOM
<g>
	<sphere></sphere>
	<script>
		// does nothing
	</script>
</g>

// => solid DOM
<g>
	<sphere></sphere>
</g>
```

Here are more examples.

```javascript
// add a cube
this.add('<cube></cube>')

// add a sphere
this.add('<sphere></sphere>')

// add a cube with parameters
this.add('<cube size="10 5 5"></cube>')

// add a cube with template parameters
this.add('<cube size="{{s}} 5 5"></cube>')

// add multiple cubes
this.add('<cube/><cube/><cube/><cube/>')
```

### Asynchronous Construction

Solid elements are constructed _asynchronously_. Why? Concurrency. Some elements may wait for files to be downloaded over the network. While waiting, the rendering engine can start working on constructing other elements, rather than being stuck waiting.

Consider the example below. Suppose the construction of `<remote-object>` involves downloading an STL file, which takes 1 second. The call to `this.add` will return immediately instead of blocking for 1 second. If we try to access the size of `<remote-object>` in the next line, we will get `undefined` because the object is still being constructed.

```html
<g>
	<cube></cube>
	<script>
		this.add('<remote-object></remote-object>')
		// return immediately
		
		this.children[1].size
		// => undefined
	</script>
</g>
```

What if we need to access the size or location of `<remote-object>`? We can do that in the next script block like this.

```html
<g>
	<cube></cube>
	<script>
		this.add('<remote-object></remote-object>')
		// return immediately		
	</script>
	<script>
		this.children[1].size
		// => {x: 10, y:10, z:10}
	</script>
</g>
```

The rendering engine ensures that all the pending child elements will get fully constructed before executing a new script block. In other words, solid elements added in one script block may not necessarily be fully constructed within the same script block, but will certainly be fully constructed before the next script block begins.

Q: Are transformation and layout methods also asynchronous?

No. All transformation and layout methods are synchronous because they are compute-bound operations (matrix mulplitcations ... etc.) and do not involve I/O operations.

```html
<g>
	<cube></cube>
	<script>
		var c = this.children[0]
		// => c === <cube>
	
		c.size.x
		// => 10
	
		c.scale(2)
		
		c.size.x
		// => 20 (the effect is immediate)
	</script>
</g>
```

# `$scope`

Access a parameter

```html
<parameter name="height" type="int" default="10"/>
<script>
	$scope.height
	//=> 10
</script>
```

Add a parameter

```html
<script>
	$scope.s = 20
</script>
<cube size="{{s}} 1 1"/>
```

```html
<script>
	$scope.s = {
		x: 1,
		y: 2,
		z: 3
	}
</script>
<cube size="{{s.x}} {{s.y}} {{s.z}}"/>
```

```html
<script>
	$scope.s = [1,2,3]
</script>
<repeat each="i" in="{{s}}">
	<cube size="{{i}} 1 1"/>
</repeat>
```



# `$` (Query)

A subset of the JQuery API is supported.

## Supported Methods

#### $(selector)
Search from `this` and select those matching the given selector.

```html
<g id="top">
	<g id="g0">
		<cube id="c0"></cube>
	</g>
	<script>
		$('g')
		// => [<g id="g0">]
	
		$('cube')
		// => [<cube id="c0">]
	</script>
</g>
```

#### $(solid)
Select a specific solid element to start querying

```html
<g id="top">
	<g id="g0">
		<cube id="foo"></cube>
	</g>
	<g id="g1">
		<cube id="bar"></cube>
	</g>	
	<script>
	
		$(this.children[0]).find('cube')
		// => [<cube id="foo">]	

		$(this.children[1]).find('cube')
		// => [<cube id="bar">]

		$(this).find('cube')
		// => [<cube id="foo">, <cube id="bar">]
	</script>
</g>
```

### .find(selector)
Get the descendants of each element in the current set of matched elements, filtered by a selector.

```html
<g id="top">
	<g id="g0">
		<cube id="foo"></cube>
	</g>
	<g id="g1">
		<cube id="bar"></cube>
	</g>	
	<cube id="cow"></cube>
	<script>
	
		$('g')
		// => [<g id="g0">, <g id="g1">]
	
		$('g').find('cube')
		// => [<cube id="foo">, <cube id="bar">]
		
		$('cube')
		// => [<cube id="foo">, <cube id="bar">, <cube id="cow">]

	</script>
</g>
```

#### .get([i])

Retrieve the i-th matched element, if `i` is specified. If `i` is not given, return all the matched elements.

```html
<g>
	<cube size="1 1 1"></cube>
	<cube size="2 2 2"></cube>
	<cube size="3 3 3"></cube>
	<script>
		$('cube').get(0).size.x
		// => 1
		
		$('cube').get(1).size.x
		// => 2
		
		$('cube').get().length
		// => 3
	</script>
</g>
```

#### .prev()

Retrieve the previous sibling of the first selected element.

```html
<g>
	<circle></circle>
	<cube></cube>
	<script>
		$('cube')
		// => [<cube>]
		
		$('cube').prev()
		// => [<circle>]
	</script>
</g>
```

#### .prevAll([selector])

Retrieve all the previous sibling of the first selected element. Optionally, a selector can be specified to filter the results.

```html
<g>
	<cube></cube>
	<circle></circle>
	<circle></circle>
	<cube id="last"></cube>
	<script>

		$('#last').prevAll().length
		// => 3

		$('#last').prevAll('circle').length
		// => 2
	</script>
</g>
```

#### .each( function(index, element) )

Iterates over the current selection.	In the callback function, `this` is bound to the element at the index (just like JQuery).

```html
<g>
	<cube size="1 1 1"></cube>
	<cube size="2 2 2"></cube>
	<cube size="3 3 3"></cube>
	<script>
		$('cube').each(function(){	
			console.log(this.size.x)
		})
	</script>
</g>

// console output: 
// 1 
// 2 
// 3
```

## Manipulation

These operations construct new solid elements. They are _asynchronous_. The effects will not be immediate within the same script block. They will take effect by the next script block.

### .wrap(content)

The .wrap() function can take any string or object that could be passed to the $() factory function to specify a DOM structure. This structure may be nested several levels deep, but should contain only one inmost element. A copy of this structure will be wrapped around each of the elements in the set of matched elements.

```html
<g>
	<cube></cube>
	<cube></cube>
	<script>
		$('cube').wrap('<g class="two"><repeat n="2"></repeat></g>')
	</script>
</g>

// => solid DOM

<g>
	<g class="two">
		<cube></cube>
		<cube></cube>
	</g>
	<g class="two">
		<cube></cube>
		<cube></cube>
	</g>
</g>
```


# Advanced Topics

These are for advanced users who are interested in hacking close to the internal of the rendering process.

* `this` the script element in the solid DOM.
* `this.src` the script element in the source DOM.
* `this.def` the defining element in the source DOM.

Applications:

* Going back and forth between the source DOM and the solid DOM.
* Lookup information from the source DOM.


## `this.src`

```html
// source DOM
<g id="top">
	<cube></cube>
	<script>
		this.src
		// => <g id="top"> in the source DOM

		this.src.scale(2)
		// error: this.src is not a solid element
		
		this
		// => <g id="top"> in the solid DOM
		
		this.scale(2)
		// ok
	</script>
</g>
```

Let's use the following example to illustrate the difference between `this` and `this.src`.

```html
// source DOM
<g>
	<repeat n="3">
		<cube></cube>
	</repeat>
</g>

// => solid DOM
<g>
	<cube></cube>
	<cube></cube>	
	<cube></cube>
</g>
```

Example 1:

```html
<g>
	<repeat n="3">
		<cube></cube>
	</repeat>
	<script>
		// the solid DOM
		this.children
		// => [cube, cube, cube]
		
		// the source DOM
		this.src.children
		// => [repeat, script]
	</script>
</g>
```

Example 2:

```html
<g>
	<repeat n="3">
		<cube></cube>
	</repeat>
	<script>
		// the solid DOM
		this.children
		// => [cube, cube, cube]
		
		// the source DOM
		this.src.children
		// => [repeat, script, sphere, sphere]
	</script>
	<sphere></sphere>
	<sphere></sphere>
</g>
```
Through `this.src`, we have access to the two sphere elements in the source DOM. In contrast, `this` does not give us access to the two sphere elements in the solid DOM, because they have not yet been constructed when the script is evaluated.


Adding elements

```html
<g>
	// source DOM
	<repeat n="3">
		<cube></cube>
	</repeat>
	<script>
		// render the first child `solid` element one more time
		// which is a cube
		this.add(this.children[0])
	</script>
</g>

// => solid DOM
<g>
	<cube></cube>
	<cube></cube>	   
	<cube></cube>
	<cube></cube>
</g>
```

```html
// source DOM
<repeat n="3">
	<cube></cube>
</repeat>
<script>
	// render the first child `source` element one more time
	// which is <repeat>
	this.add(this.src.children[0])
</script>

// => solid DOM
<g>
	<cube></cube>
	<cube></cube>
	<cube></cube>	
	<cube></cube>
	<cube></cube>
	<cube></cube>		
</g>
```

## `this.def`

`$(this.def)` is useful when we need to refer to the source DOM element that actually _defines_ how an instance of a craft tag should be constructed and inserted into a solid DOM.

Consider the example below, suppose we declare a craft tag for generating three cubes and name it `threesome`. Then, we define two instances of this craft tag with `<bar>` and `<cow>` as the children elements respectively. The script block will get exeuted twice. In each exeuction, `this.def` will refer to a different `<threesome>`.

```html
// Source
<craft name="threesome">
	<repeat n="3">
		<cube></cube>
	</repeat>
	<script>
		// get children in the solid DOM
		this.children
		// => [cube, cube, cube]
		
		// get children in the source DOM
		this.src.children
		// => [repeat, script]
				
		// get the children of the defining element in the source DOM
		this.def.children
		// => [bar] on the first call
		// => [cow] on the second call
	</script>
</craft>

<g>
	<sphere></sphere>
	<threesome>
		<bar></bar>
	</threesome>
	<threesome>
		<cow></cow>
	</threesome>	
</g>
```

# Content


Bigger

```html
<craft name="bigger">
	<content></content>
	<script>
		$(this).children().each(function(){
			this.scale(2)
		})
	</script>
</craft>
```


Before

```html
<cube xsize="1"></cube>
<cube xsize="2"></cube>	
<script>
	$('cube').get(0).size.x
	// => 1
		
	$('cube').get(1).size.x
	// => 2
</script>
```

```html
<bigger>
	<cube xsize="1"></cube>
	<cube xsize="2"></cube>	
</bigger>
<script>
	$('cube').get(0).size.x
	// => 2
		
	$('cube').get(1).size.x
	// => 4
</script>
```

## sun-layout

```html
<content></content>
<script>
	var elements = this.children
	var n = elements.length
	var r = $scope.radius, theta = 0
	var delta = 2 * Math.PI / n
	var ps = []
	for (var i = 0; i < n; i++){
		var el = elements[i]
		var loc = {
            x: -(r * Math.cos(theta) + el.position.x/2),
            y: -(r * Math.sin(theta) + el.position.y/2),
            z: 0
       }
		var angle = 360/n * (i - (n / 4))
		el.rotateZ(angle)
		el.center(loc)
		theta = theta + delta
    }
</script>
```

## auto-size

```html
<g id="foo">
	<content></content>
</g>
<script>
	var g = $('#foo').get(0)
	$scope.s = g.size
</script>
<cube size="{{s.x}} {{s.y}} 1"/>
```

which is equivalent to

```html
<g id="foo">
	<content></content>
</g>
<script>
	var g = $('#foo').get(0)
	$scope.foo = g.foo
</script>
<cube size="{{foo.size.x}} {{foo.size.y}} 1"/>
```
which is equivalent to 

Proposed feature: 

* Every tag has a `ref` attribute will get constructed first and made available in `$scope` for the others.
* Limitation. A tag with a `ref` name is unable to refer to other sibilings by names, because those sibilings may not be fully constructed yet.
* This basically results in a dependency tree of depth = 2.

```html
<g ref="foo">
	<content></content>
</g>
<g>
	<cube size="{{foo.size.x}} {{foo.size.y}} 1"/>
</g>
```

```html
<g>
	<g ref="foo">
		<cube></cube>
	</g>
	<g ref="bar">
		<sphere></sphere>
	</g>
	<g>
		<cube size="{{foo.size.x}} {{foo.size.y}} 1" ref="bar"/>
	</g>
</g>
```

```html
<g>
	<g ref="foo">
		<cube></cube>
	</g>
	<g ref="bar">
		<sphere></sphere>
		<script>
			$scope.foo
			// => undefined	
			// because <g ref="foo"> is also being constructed in parallel
		</script>
	</g>
	<g>
		<script>
			$scope.foo
			// => <g ref="foo">
		</script>
		<cube size="{{foo.size.x}} {{foo.size.y}} 1" ref="bar"/>
	</g>
</g>
```

Use

Put A above B

```html
<g>
	<cube ref="a"></cube>
	<sphere transform="setZ({{a.size.z}})"></sphere>
</g>
```

Alternative: let the users define references. not as good.

```html
<g id="foo">
	<content></content>
</g>
<cube refs="#foo as f" size="{{f.size.x}} {{f.size.y}} 1"/>
```

# Examples

```html
<cube></cube>
<cube></cube>
<script>
	$(this).children().each(function(){
		this.rotateX(45)
	})
</script>
```


Select cubes and center them along X. The code below all accomplish this.

```html
<g>
	<cube></cube>
	<cube></cube>
	<sphere></sphere>
	<script>
		$(this).children('cube').layout('centerX()')
	</script>
</g>
```

```html
<g>
	<cube></cube>
	<cube></cube>
	<sphere></sphere>
	<script>
		this.layout('select(cube) centerX()')
	</script>
</g>
```

```html
<g layout='select(cube) centerX()'>
	<cube></cube>
	<cube></cube>
	<sphere></sphere>
</g>
```