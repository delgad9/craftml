var contents = $('#content').html()
React.render(<CraftApp contents={contents}/>,
    document.getElementById('content')
)

contents = $('#content1').html()
React.render(<CraftApp contents={contents}/>,
    document.getElementById('content1')
)