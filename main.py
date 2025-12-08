import flask
from flask import Flask, jsonify, request  
from flask import render_template

app = Flask(__name__)
@app.route('/')
def home():
    return render_template('index.html')

app.route('/about')
def about():
    return "This is a simple Flask API example."


@app.route('/api/data', methods=['GET'])
def get_data():
    sample_data = {
        'name': 'Flask API',
        'version': '1.0',
        'description': 'A simple Flask API example'
    }
    return jsonify(sample_data)
@app.route('/api/echo', methods=['POST'])
def echo_data():
    data = request.json
    return jsonify({
        'received_data': data
    })
if __name__ == '__main__':
    app.run(debug=True)
