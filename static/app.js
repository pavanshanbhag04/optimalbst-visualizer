document.getElementById("generate-tree-btn").addEventListener("click", async () => {
    const keysInput = document.getElementById("keys").value.trim();
    const freqInput = document.getElementById("freq").value.trim();

    const keys = keysInput.split(",").map(key => key.trim());
    const freq = freqInput.split(",").map(f => parseInt(f.trim()));

    if (keys.length !== freq.length || keys.length === 0) {
        alert("Please enter valid keys and frequencies.");
        return;
    }

    const response = await fetch("/generate-tree", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ keys, freq })
    });

    const treeData = await response.json();
    console.log("Tree Data:", treeData); // Debugging
    
    // Display optimal cost
    const optimalCost = treeData.optimal_cost;
    document.getElementById("optimal-cost").textContent = optimalCost;

    renderTree(treeData.tree); // Render the tree structure
});

document.getElementById("search-key-btn").addEventListener("click", async () => {
    const searchKey = document.getElementById("search-key").value.trim();

    if (!searchKey) {
        alert("Please enter a key to search.");
        return;
    }

    const searchResponse = await fetch("/search", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            tree: window.treeData,
            key: searchKey
        })
    });

    const searchResult = await searchResponse.json();
    const level = searchResult.level;
    const searchPath = searchResult.search_path;

    const resultMessage = (level === -1) ? `Key ${searchKey} not found in the tree.` : `Key ${searchKey} is at level ${level}.`;
    document.getElementById("search-result").textContent = resultMessage;

    // Re-render tree with the search path highlighted
    renderTree(window.treeData, searchPath);
    highlightSearchPathWithDelay(searchPath);
});

function renderTree(treeData, searchPath = []) {
    const treeContainer = document.getElementById("tree-container");
    treeContainer.innerHTML = ""; // Clear any existing tree

    const width = 800;
    const height = 600;

    const svg = d3.select("#tree-container")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg.append("g")
        .attr("transform", "translate(50, 50)");

    const treeLayout = d3.tree().size([width - 100, height - 100]);
    const root = d3.hierarchy(treeData, d => (d ? [d.left, d.right].filter(n => n !== null) : []));
    window.treeData = treeData; // Store tree data globally for search

    treeLayout(root);

    // Add links (branches)
    const links = g.selectAll(".link")
        .data(root.links())
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y)
        .style("stroke", "black")
        .style("stroke-width", 2);

    // Add nodes
    const nodes = g.selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    nodes.append("circle")
        .attr("r", 20)
        .attr("fill", d => searchPath.includes(d.data.key) ? "red" : "lightblue") // Highlight nodes in search path
        .attr("stroke", "black");

    nodes.append("text")
        .attr("dy", 5)
        .attr("x", 0)
        .attr("text-anchor", "middle")
        .text(d => d.data.key);

    // Highlight branches in search path
    links.style("stroke", d => {
        return searchPath.includes(d.source.data.key) && searchPath.includes(d.target.data.key) ? "red" : "black";
    });
}

// Function to highlight the search path progressively with a delay for each node and branch
function highlightSearchPathWithDelay(searchPath) {
    let delay = 0;

    // Traverse each key in the search path
    searchPath.forEach((key, index) => {
        setTimeout(() => {
            const node = d3.select(`.node:has(text:contains('${key}'))`);
            const circle = node.select("circle");
            const link = d3.selectAll(".link")
                .filter(d => d.source.data.key === key || d.target.data.key === key);

            // Highlight the node and branches
            circle.transition().duration(300).attr("fill", "red").attr("stroke", "darkred");
            link.transition().duration(300).style("stroke", "red");

        }, delay);

        delay += 1000; // Delay of 1 second per node and its corresponding branch
    });
}

// Modified search function that tracks the path of traversal
function search_key(node, key, path = []) {
    if (node === null) {
        return { found: false, path: path }; // Key not found
    }
    path.push(node.key);  // Add current node to path

    if (node.key === key) {
        return { found: true, path: path };  // Key found
    }

    if (key < node.key) {
        return search_key(node.left, key, path);  // Go left
    } else {
        return search_key(node.right, key, path);  // Go right
    }
}
