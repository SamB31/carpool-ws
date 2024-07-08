import SwiftUI
import Foundation

struct FamilyMember: Identifiable, Decodable {
    var id = UUID()
    let firstName: String
    let lastName: String
    let familyId: Int
    let createdAt: String
    
    enum CodingKeys: String, CodingKey {
        case firstName, lastName, familyId, createdAt
    }
}


class WebSocketManager: ObservableObject {
    @Published var members: [FamilyMember] = []
    var websocketTask: URLSessionWebSocketTask?

    func connect() {
        guard let url = URL(string: "ws://192.168.1.143:8080") else {
            print("Error: Cannot create URL")
            return
        }
        let session = URLSession(configuration: .default)
        websocketTask = session.webSocketTask(with: url)
        websocketTask?.resume()
        
        sendMessage(message: "{\"page\": \"1\"}")
        
        receive()
    }
    
    func sendMessage(message: String) {
        let message = URLSessionWebSocketTask.Message.string(message)
        websocketTask?.send(message) { error in
            if let error = error {
                print("Error sending message: \(error)")
            }
        }
    }
    
    func receive() {
        websocketTask?.receive { [weak self] result in
            switch result {
            case .failure(let error):
                print("Error in receiving message: \(error)")
            case .success(.string(let jsonString)):
                self?.handleMessage(jsonString: jsonString)
                self?.receive() // Listen recursively
            default:
                print("Received data is not string")
                self?.receive() // Listen recursively
            }
        }
    }
    
    func handleMessage(jsonString: String) {
        if let data = jsonString.data(using: .utf8) {
            if let jsonData = try? JSONDecoder().decode(WebSocketData.self, from: data) {
                DispatchQueue.main.async {
                    self.members = jsonData.data
                }
            }
        }
    }
    
    func disconnect() {
        websocketTask?.cancel()
    }
}

struct WebSocketData: Decodable {
    let type: String
    let data: [FamilyMember]
}

struct ContentView: View {
    @StateObject var websocketManager = WebSocketManager()
    @State private var familyId: String = ""
    
    var body: some View {
        NavigationView {
            
            VStack {
                
                VStack {
                    List(websocketManager.members) { member in
                        VStack(alignment: .leading) {
                            Text("\(member.firstName) \(member.lastName)")
                                .font(.headline)
                            Text("Family ID: \(member.familyId)")
                        }
                    }
                    .onAppear {
                        websocketManager.connect()
                    }
                    .onDisappear {
                        websocketManager.disconnect()
                    }
                }
                
                
                TextField("Enter Family ID", text: $familyId)
                    .keyboardType(.numberPad)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .padding()

                HStack { // Use HStack to arrange buttons horizontally
                    Button(action: {
                        self.sendRequest(familyId: self.familyId, endpoint: "submit-check-in")
                        self.familyId = ""
                    }) {
                        Text("Check In")
                            .foregroundColor(.white)
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity)
                    }
                    .background(Color.blue)
                    .cornerRadius(8)

                    Button(action: {
                        self.sendRequest(familyId: self.familyId, endpoint: "submit-check-out")
                        self.familyId = ""
                    }) {
                        Text("Check Out")
                            .foregroundColor(.white)
                            .padding(.vertical, 10)
                            .frame(maxWidth: .infinity)
                    }
                    .background(Color.red)
                    .cornerRadius(8)
                }
                .padding(.horizontal)
                .padding(.bottom, 10)
                .frame(maxWidth: .infinity)
                
            }
            .navigationBarTitle("Canton Carpool", displayMode: .inline)
            .navigationBarItems(trailing: Button(action: {
                websocketManager.disconnect()  // First, disconnect the existing connection
                websocketManager.connect()     // Then reconnect
            }) {
                Image(systemName: "arrow.clockwise")  // System icon for refresh
                    .resizable()
                    .frame(width: 20, height: 20)
            })
        }
    }

    
    func sendRequest(familyId: String, endpoint: String) {
        guard let url = URL(string: "http://192.168.1.143:8080/\(endpoint)") else { return }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["familyId": familyId]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)
        
        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("Error: \(error)")
                return
            }
            if let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode != 200 {
                print("HTTP Error: \(httpResponse.statusCode)")
                return
            }
            if let data = data, let responseData = String(data: data, encoding: .utf8) {
                print("Response: \(responseData)")
            }
        }.resume()
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
