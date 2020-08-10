const path = require('path');
const webpack = require('webpack');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

const ROOT = path.resolve( __dirname, 'src' );
const DESTINATION = path.resolve( __dirname, 'dist' );

module.exports = {
    context: ROOT,

    entry: {
        'main': './main.ts'
    },
    
    output: {
        filename: '[name].bundle.js',
        path: DESTINATION
    },

    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
        modules: [
            ROOT,
            'node_modules'
        ]
    },

    plugins: [
        new MiniCssExtractPlugin(),
        new CleanWebpackPlugin(),
        new CopyWebpackPlugin([
            { from: ROOT + '/assets/**/*', to: DESTINATION },
            { from: ROOT + '/_redirects', to: DESTINATION },
            { from: ROOT + '/*.html', to: DESTINATION }
        ]),
        new HtmlWebpackPlugin({
            template: ROOT + '/index.html',
            inject: true,
            minify: {
                removeComments: true,
                collapseWhitespace: false
            }
        })
    ],

    module: {
        rules: [
            /****************
            * PRE-LOADERS
            *****************/
            {
                enforce: 'pre',
                test: /\.js$/,
                use: 'source-map-loader'
            },
            {
                enforce: 'pre',
                test: /\.ts$/,
                exclude: /node_modules/,
                use: 'tslint-loader'
            },

            /****************
            * LOADERS
            *****************/
            {
                test: /\.tsx?$/,
                exclude: [ /node_modules/ ],
                use: 'ts-loader'
            },
            {
                test: [/.css$/],                
                use:[                    
                MiniCssExtractPlugin.loader,                  
                'css-loader'
                ]   
            },
            {
                test: /\.(png|jpg|gif|svg)$/,
                use: [
                  {
                    loader: 'file-loader',
                    options: {
                      name: '[name].[ext]',
                      outputPath: 'assets/'
                    }
                  }
                ]
            }
        ]
    },

    devtool: 'cheap-module-source-map',
    devServer: {}
};

