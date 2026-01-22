package search_eng;
import java.util.ArrayList;

public class MyWebGraph {
	// this field is made public for testing purposes 
	public MyHashTable<String, WebVertex> vertexList; 
	
	public MyWebGraph () {
		vertexList = new MyHashTable<String, WebVertex>();
	}

	/*
	 * adds a vertex given a url
	 * returns true if the graph has changed as a result of this operation
	 * false otherwise. Note that the method should add the vertex only if a vertex
	 * associated to the given url is not there yet.
	 */
	public boolean addVertex(String s) {
		if (vertexList.get(s) != null) {
			return false;
		}
		vertexList.put(s, new WebVertex(s));
		return true;
	}

	public boolean addEdge(String s, String t) {
		WebVertex from = vertexList.get(s);
		WebVertex to = vertexList.get(t);
		if (from == null || to == null){
			return false;
		}
		return from.addEdge(t);
	}

    public ArrayList<String> getNeighbors(String url) {
        return vertexList.get(url).getNeighbors();
    }

    public ArrayList<String> getVertices() {
		return vertexList.keySet();
    }

    public ArrayList<String> getEdgesInto(String v) {
		ArrayList<String> incoming = new ArrayList<>();
		for (String url : vertexList.keySet()) {
			if (vertexList.get(url).containsEdge(v)) {
				incoming.add(url);
			}
		}
		return incoming;
    }

    public int getOutDegree(String url) {
    	// NullPointerException raised if there's no vertex with specified url
        return vertexList.get(url).links.size();
    }

    public void setPageRank(String url, double pr) {
        vertexList.get(url).rank = pr;
    }

    public double getPageRank(String url) {
        if (vertexList.get(url)!=null)
        	return (vertexList.get(url)).rank;

        return 0;
    }

    // sets the visited status of a given url
    public boolean setVisited(String url, boolean b) {
        if (vertexList.get(url)!=null) {
        	(vertexList.get(url)).visited = b;
        	return true;
        }
        return false;
    }

    // returns the visited status of a given url
    public boolean getVisited(String url) {
        if (vertexList.get(url)!=null)
        	return (vertexList.get(url)).visited;

        return false;
    }


    public String toString() {
    	String info = "";
        for (String s: vertexList.keySet()) {
        	info += s.toString() + "\n";
        }
        return info;
    }

    public class WebVertex {
		private String url;
		public ArrayList<String> links;
		private boolean visited;
		private double rank;
		
		public WebVertex (String url) {
			this.url = url;
			this.links = new ArrayList<String>();
			this.visited = false;
			this.rank = 0;
		}


		public boolean addEdge(String v) {
			if (!this.links.contains(v)) {
				this.links.add(v);
				return true;
			}
			return false;
		}


	    public ArrayList<String> getNeighbors() {
	        return this.links;
	    }


	    public boolean containsEdge(String e) {
	    	return this.links.contains(e);
	    }


		public String toString() {
			return this.url + "\t" + this.visited + "\t" + this.rank;
		}

	}
	
	

}
