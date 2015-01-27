# craftml

<craft>
    
    <parameter name="depth" type="int" initial="1"/>
    <parameter name="headRadius" type="int" initial="1"/>
    <parameter name="headDepth" type="int" initial="3"/>

    <craft name="head" module="craft-head"/>
    
    <craft name="base" src="./base.xml"/>

    <craft name="needle">
        <parameter name="depth" type="int" initial="2">

        <craft name="needlefoo">
            <script>
                function main(params){
                    params.depth == 1 or 2??
                    return //someting
                }
            </script>
        </craft>
            

        <script type="text/openjscad">
            // headRadius and headDepth are inherited from the outer scope            
            function main(params){                
                params.depth == 1 or 2???
                needlefoo() // hard ot know what 'params' is
                return //someting
            }
        </script>
    </craft>

    <craft name="twoneedles">
        <needle depth="5"></needle>
        <head><needle></needle></head>
    </craft>

    <script type="text/openjscad">
    // default to "text/openjscad"
    // can only have one script block

        // programmatically require another module
        var cross = craft('craft-cross')

        // programmatically require another module
        var base = craft('./base.xml')

        // programmatically define a private craft
        var needle = function(){

            var foo = craft('./foo.xml')

            function main(params) {
                var a = foo()
                var c = cylinder({
                    r: 1,
                    h: params.depth,
                    center: [true, true, false]
                })
                return union(a,c)
            }

            function getParameterDefinitions(){
                return [{name: 'depth', type: 'int', initial: 3, caption: "depth of the needle"}]
            }

            return craft(main, getParameterDefinitions)
        }()
        


        function(customParams){
            return function (parantParams){
                var params = marge(getParameterDefinitions(), customParams, parentParams)
                return main(params)
            }
        }

        var twoneedles =
            craft({},[
                 needle({depth:5}), 
                 head({},[
                    needle(),
                    needle()])])

        // programmatically define parameters
        function getParameterDefinitions() {
          return [
            { name: 'width', type: 'float', initial: 10, caption: "Width of the cube:" },
            { name: 'height', type: 'float', initial: 14, caption: "Height of the cube:" },
            ]
        }
 
        function main(params) {

            // needle
            var n = needle({depth: params.headDepth})

            // head
            var h = head({radius: params.headRadius, depth: params.headDepth})

            // cross
            var c = cross()
                
            h = h.translate([0, 0, params.depth])
            return union(h, n)
        }
    </script>

</craft>
