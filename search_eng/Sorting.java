package search_eng;
import java.util.ArrayList;

public class Sorting {

	/*
	 * This method takes as input an MyHashTable with values that are Comparable. 
	 * It returns an ArrayList containing all the keys from the map, ordered 
	 * in descending order based on the values they mapped to. 
	 * 
	 * The time complexity for this method is O(n^2), where n is the number 
	 * of pairs in the map. 
	 */
    public static <K, V extends Comparable<V>> ArrayList<K> slowSort (MyHashTable<K, V> results) {
        ArrayList<K> sortedUrls = new ArrayList<K>();
        sortedUrls.addAll(results.keySet());	//Start with unsorted list of urls

        int N = sortedUrls.size();
        for(int i=0; i<N-1; i++){
			for(int j=0; j<N-i-1; j++){
				if(results.get(sortedUrls.get(j)).compareTo(results.get(sortedUrls.get(j+1))) < 0){
					K temp = sortedUrls.get(j);
					sortedUrls.set(j, sortedUrls.get(j+1));
					sortedUrls.set(j+1, temp);					
				}
			}
        }
        return sortedUrls;                    
    }
    
    
	/*
	 * This method takes as input an MyHashTable with values that are Comparable. 
	 * It returns an ArrayList containing all the keys from the map, ordered 
	 * in descending order based on the values they mapped to. 
	 * 
	 * The time complexity for this method is O(n*log(n)), where n is the number 
	 * of pairs in the map. 
	 */    
    public static <K, V extends Comparable<V>> ArrayList<K> fastSort(MyHashTable<K, V> results) {
		ArrayList<MyPair<K,V>> list = new ArrayList<>(results.entrySet());
		mergeSort(list, 0, list.size()-1);
		ArrayList<K> keys = new ArrayList<>();
		for (MyPair<K,V> p : list) keys.add(p.getKey());
		return keys;
    }

	//private helper methods to implement fastSort
	private static <K, V extends Comparable<V>> void mergeSort(ArrayList<MyPair<K,V>> arr, int l, int r) {
		if (l < r) {
			int m = (l + r) / 2;
			mergeSort(arr, l, m);
			mergeSort(arr, m+1, r);
			merge(arr, l, m, r);
		}
	}

	private static <K, V extends Comparable<V>> void merge(ArrayList<MyPair<K,V>> arr, int l, int m, int r) {
		ArrayList<MyPair<K,V>> left = new ArrayList<>(arr.subList(l, m+1));
		ArrayList<MyPair<K,V>> right = new ArrayList<>(arr.subList(m+1, r+1));
		int i=0, j=0, k=l;
		while(i < left.size() && j < right.size()) {
			if (left.get(i).getValue().compareTo(right.get(j).getValue()) >= 0) {
				arr.set(k++, left.get(i++));
			} else {
				arr.set(k++, right.get(j++));
			}
		}
		while (i < left.size()) arr.set(k++, left.get(i++));
		while (j < right.size()) arr.set(k++, right.get(j++));
	}
   
}