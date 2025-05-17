from flask import Flask, render_template, request, jsonify
import json

app = Flask(__name__)

def optimal_bst(keys, freq, n):
    # Initialize DP tables
    dp = [[0] * n for _ in range(n)]
    root = [[0] * n for _ in range(n)]
    
    # Create a prefix sum array to speed up the summing of frequencies
    prefix_sum = [0] * (n + 1)
    for i in range(n):
        prefix_sum[i + 1] = prefix_sum[i] + freq[i]
    
    # Initialize base case where there's only one key
    for i in range(n):
        dp[i][i] = freq[i]
        root[i][i] = i

    # Fill DP table for larger subtrees
    for length in range(2, n + 1):  # length of the interval
        for i in range(n - length + 1):
            j = i + length - 1
            dp[i][j] = float("inf")
            # Try every key as the root and compute the cost
            for r in range(i, j + 1):
                cost = (
                    (dp[i][r - 1] if r > i else 0) +
                    (dp[r + 1][j] if r < j else 0) +
                    (prefix_sum[j + 1] - prefix_sum[i])  # Use prefix sum for frequency sum
                )
                if cost < dp[i][j]:
                    dp[i][j] = cost
                    root[i][j] = r

    def build_tree(i, j):
        if i > j:
            return None
        r = root[i][j]
        return {
            "key": keys[r],
            "left": build_tree(i, r - 1),
            "right": build_tree(r + 1, j)
        }

    return build_tree(0, n - 1), dp[0][n - 1]  # Return tree and optimal cost

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/generate-tree", methods=["POST"])
def generate_tree():
    data = request.json
    keys = [int(key) for key in data['keys']]
    freq = [int(f) for f in data['freq']]
    tree, optimal_cost = optimal_bst(keys, freq, len(keys))
    return jsonify({
        "tree": tree,
        "optimal_cost": optimal_cost
    })

@app.route("/search", methods=["POST"])
def search():
    data = request.json
    tree = data['tree']
    key = int(data['key'])

    def search_key(node, key, path=None, level=0):
        if node is None:
            return -1, []  # Key not found
        if path is None:
            path = []

        path.append(node['key'])

        if node['key'] == key:
            return level, path  # Return the level and search path
        elif key < node['key']:
            return search_key(node['left'], key, path, level + 1)
        else:
            return search_key(node['right'], key, path, level + 1)

    level, search_path = search_key(tree, key)
    return jsonify({
        "level": level,
        "search_path": search_path
    })

if __name__ == "__main__":
    app.run(debug=True)

if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)


