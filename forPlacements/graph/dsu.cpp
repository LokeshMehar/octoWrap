#include <bits/stdc++.h>
using namespace std;

// Disjoint Set Union (Union-Find) with path compression and union by size
class DSU {     
private:
    vector<int> parent, size;           
public:
    DSU(int n) {
        parent.resize(n);
        size.resize(n, 1);
        for (int i = 0; i < n; ++i) {
            parent[i] = i; // Initialize each node to be its own parent
        }
    }   
    // Find the root of the set containing x with path compression
    int find(int x) {
        if (parent[x] != x) {
            parent[x] = find(parent[x]); // Path compression
        }
        return parent[x];
    }
    // Union the sets containing x and y by size
    void unionSets(int x, int y) {
        int rootX = find(x);
        int rootY = find(y);
        if (rootX != rootY) {
            // Union by size
            if (size[rootX] < size[rootY]) {
                swap(rootX, rootY);
            }
            parent[rootY] = rootX; // Make rootX the parent of rootY
            size[rootX] += size[rootY]; // Update the size of the new root
        }
    }
    // Check if x and y are in the same set
    bool sameSet(int x, int y) {
        return find(x) == find(y);
    }
    // Get the size of the set containing x
    int getSize(int x) {
        return size[find(x)];
    }   
    // Get the number of disjoint sets
    int getNumSets() {
        set<int> uniqueRoots;
        for (int i = 0; i < parent.size(); ++i) {
            uniqueRoots.insert(find(i));
        }
        return uniqueRoots.size();
    }
    // Get the parent of x
    int getParent(int x) {
        return find(x);
    }
    // Get the size of the DSU
    int getSize() {
        return parent.size();
    }
    // Print the DSU for debugging
    void print() {
        for (int i = 0; i < parent.size(); ++i) {
            cout << "Node: " << i << ", Parent: " << parent[i] << ", Size: " << size[i] << endl;
        }
    }
    // Get all sets in the DSU
    vector<vector<int>> getAllSets() {
        unordered_map<int, vector<int>> sets;
        for (int i = 0; i < parent.size(); ++i) {
            sets[find(i)].push_back(i);
        }
        vector<vector<int>> result;
        for (const auto& pair : sets) {
            result.push_back(pair.second);
        }
        return result;
    }
    // Get the number of elements in the DSU
    int getNumElements() {
        return parent.size();
    }
    // Clear the DSU
    void clear() {
        for (int i = 0; i < parent.size(); ++i) {
            parent[i] = i; // Reset each node to be its own parent
            size[i] = 1; // Reset size to 1
        }
    }
    // Check if the DSU is empty
    bool isEmpty() {
        return parent.empty();
    }
    // Resize the DSU
    void resize(int n) {
        parent.resize(n);
        size.resize(n, 1);
        for (int i = 0; i < n; ++i) {
            parent[i] = i; // Initialize each node to be its own parent
        }
    }
    // Merge another DSU into this one
    void merge(const DSU& other) {
        for (int i = 0; i < other.getSize(); ++i) {
            if (other.parent[i] != i) {
                unionSets(i, other.parent[i]);
            }
        }
    }
    // Get the number of unique roots in the DSU
    int getNumUniqueRoots() {
        set<int> uniqueRoots;
        for (int i = 0; i < parent.size(); ++i) {
            uniqueRoots.insert(find(i));
        }
        return uniqueRoots.size();
    }
    // Get the size of the largest set
    int getLargestSetSize() {   
        int maxSize = 0;
        for (int i = 0; i < size.size(); ++i) {
            if (parent[i] == i) { // Only consider roots
                maxSize = max(maxSize, size[i]);
            }
        }
        return maxSize;
    }
    // Get the smallest set size
    int getSmallestSetSize() {
        int minSize = INT_MAX;
        for (int i = 0; i < size.size(); ++i) {
            if (parent[i] == i && size[i] > 0) { // Only consider roots with size > 0
                minSize = min(minSize, size[i]);
            }
        }
        return (minSize == INT_MAX) ? 0 : minSize; // Return 0 if no sets are found
    }
    // Get the average size of the sets
    double getAverageSetSize() {
        int totalSize = 0;
        int numSets = 0;
        for (int i = 0; i < size.size(); ++i) {
            if (parent[i] == i) { // Only consider roots
                totalSize += size[i];
                numSets++;
            }
        }
        return (numSets == 0) ? 0.0 : static_cast<double>(totalSize) / numSets; // Avoid division by zero
    }
};


