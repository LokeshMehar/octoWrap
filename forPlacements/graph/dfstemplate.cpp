#include <bits/stdc++.h>
using namespace std;

int dfs(int u, vector<vector<int>>& adj, vector<bool>& visited) {
    visited[u] = true;
    int count = 1; // Count the current node

    for (int v : adj[u]) {
        if (!visited[v]) {
            count += dfs(v, adj, visited);
        }
    }

    return count;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    cin >> n >> m;

    vector<vector<int>> adj(n + 1);
    for (int i = 0; i < m; ++i) {
        int u, v;
        cin >> u >> v;
        adj[u].push_back(v);
        adj[v].push_back(u);
    }

    vector<bool> visited(n + 1, false);
    int components = 0; 

    for (int i = 1; i <= n; ++i) {
        if (!visited[i]) {
            int size = dfs(i, adj, visited);
            cout << "Component " << ++components << " size: " << size << '\n';
        }
    }
    if (components == 0) {
        cout << "No components found.\n";
    } else {
        cout << "Total components: " << components << '\n';
    }       
    return 0;

    
}