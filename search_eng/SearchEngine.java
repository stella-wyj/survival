package search_eng;
import java.util.ArrayList;

public class SearchEngine {
	public MyHashTable<String, ArrayList<String> > wordIndex;   // this will contain a set of pairs (String, LinkedList of Strings)	
	public MyWebGraph internet;
	public XmlParser parser;

	public SearchEngine(String filename) throws Exception{
		this.wordIndex = new MyHashTable<String, ArrayList<String>>();
		this.internet = new MyWebGraph();
		this.parser = new XmlParser(filename);
	}
	
	public void crawlAndIndex(String url) {
		ArrayList<String> stack = new ArrayList<>();
		stack.add(url);
		internet.addVertex(url);
		while(!stack.isEmpty()){
			String u = stack.remove(stack.size()-1);
			if(internet.getVisited(u)) continue;
			internet.setVisited(u,true);
			internet.addVertex(u);
			ArrayList<String> links = parser.getLinks(u);
			for(String v:links){
				internet.addVertex(v);
				internet.addEdge(u,v);
				if(!internet.getVisited(v)) stack.add(v);
			}
			ArrayList<String> tokens = parser.getContent(u);
			for(String w:tokens){
				if(w.isEmpty()) continue;
				String key = w.toLowerCase();
				ArrayList<String> list = wordIndex.get(key);
				if(list == null){ list = new ArrayList<>(); wordIndex.put(key,list); }
				if(!list.contains(u)) list.add(u);
			}
		}
	}

	public void assignPageRanks(double epsilon) {
		ArrayList<String> verts = internet.getVertices();
		for(String v:verts) internet.setPageRank(v,1.0);
		double d = 0.5;
		while(true){
			ArrayList<Double> next = computeRanks(verts);
			boolean converged = true;
			for(int i=0;i<verts.size();i++){
				double old = internet.getPageRank(verts.get(i));
				if(Math.abs(old - next.get(i)) >= epsilon){
					converged=false; break;
				}
			}
			for(int i=0;i<verts.size();i++) internet.setPageRank(verts.get(i), next.get(i));
			if(converged){ break;}
		}
	}

	public ArrayList<Double> computeRanks(ArrayList<String> vertices) {
		ArrayList<Double> ranks = new ArrayList<>();
		double d = 0.5;
		for(String v:vertices){
			double sum=0;
			for(String u:internet.getEdgesInto(v)) sum += internet.getPageRank(u)/internet.getOutDegree(u);
			ranks.add((1-d)+d*sum);
		}
		return ranks;
	}

	public ArrayList<String> getResults(String query) {
		ArrayList<String> list = wordIndex.get(query.toLowerCase());
		if(list==null) {
			return new ArrayList<>();
		}
		MyHashTable<String,Double> rankMap = new MyHashTable<>();
		for(String u:list) {
			rankMap.put(u, internet.getPageRank(u));
		}
		return Sorting.fastSort(rankMap);
	}
	
}
